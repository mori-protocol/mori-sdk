// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./libraries/SafeCast.sol";
import "./interfaces/INonfungiblePositionManager.sol";
import "./interfaces/INonfungiblePositionManagerStruct.sol";
import "./interfaces/IMoriV3Pool.sol";
import "./interfaces/ILMPool.sol";
import "./interfaces/ILMPoolDeployer.sol";
import "./interfaces/IFarmBooster.sol";
import "./interfaces/IWETH.sol";
import "./interfaces/IVault.sol";
import "./utils/Multicall.sol";
import "./Enumerable.sol";

contract MasterChefV3 is INonfungiblePositionManagerStruct, Multicall, Ownable, ReentrancyGuard, Enumerable {
    using SafeERC20 for IERC20;
    using SafeCast for uint256;

    struct PoolRewarderInfo {
        IERC20 rewardToken;
        uint256 rewardPerSecond;
        uint32 endTime;
        uint256 releasedAmount;
        uint256 harvestedAmount;
    }

    struct PoolInfo {
        // V3 pool address
        IMoriV3Pool v3Pool;
        // V3 pool token0 address
        address token0;
        // V3 pool token1 address
        address token1;
        // V3 pool fee
        uint24 fee;
        // total liquidity staking in the pool
        uint256 totalLiquidity;
        // total boost liquidity staking in the pool
        uint256 totalBoostLiquidity;
        // the masterchef list
        PoolRewarderInfo[] rewarderList;
        // the latest timestamp when accumulated token was last calculated for the pool
        uint32 latestAccumulateTime;
    }

    struct PositionRewardInfo {
        uint256 rewardGrowthInside;
        uint256 reward;
    }

    struct UserPositionInfo {
        uint128 liquidity;
        uint128 boostLiquidity;
        int24 tickLower;
        int24 tickUpper;
        address user;
        uint256 pid;
        uint256 boostMultiplier;
        mapping(address => PositionRewardInfo) rewardInfo;
    }

    uint256 public poolLength;
    /// @notice Info of each MCV3 pool.
    mapping(uint256 => PoolInfo) public poolInfo;

    /// @notice userPositionInfos[tokenId] => UserPositionInfo
    /// @dev TokenId is unique, and we can query the pid by tokenId.
    mapping(uint256 => UserPositionInfo) public userPositionInfos;

    /// @notice v3PoolPid[token0][token1][fee] => pid
    mapping(address => mapping(address => mapping(uint24 => uint256))) v3PoolPid;
    /// @notice v3PoolAddressPid[v3PoolAddress] => pid
    mapping(address => uint256) public v3PoolAddressPid;

    mapping(address => mapping(address => uint256)) public poolRewarderIndex;

    INonfungiblePositionManager public immutable nonfungiblePositionManager;

    /// @notice Address of liquidity mining pool deployer contract.
    ILMPoolDeployer public LMPoolDeployer;

    /// @notice Address of the operator.
    address public operatorAddress;

    /// @notice Address of WETH contract.
    address public immutable WETH;

    /// @notice Address of vault contract.
    IVault public vault;

    /// @notice Only use for emergency situations.
    bool public emergency;

    /// @notice Address of farm booster contract.
    IFarmBooster public FARM_BOOSTER;

    /// @notice Default period duration.
    uint256 public constant MAX_DURATION = 120 days;
    uint256 public constant MIN_DURATION = 1 days;
    uint256 public constant REWARD_PRECISION = 1e12;

    /// @notice Basic boost factor, none boosted user's boost factor
    uint256 public constant BOOST_PRECISION = 100 * 1e10;
    /// @notice Hard limit for maxmium boost factor, it must greater than BOOST_PRECISION
    uint256 public constant MAX_BOOST_PRECISION = 200 * 1e10;

    uint256 constant Q128 = 0x100000000000000000000000000000000;
    uint256 constant MAX_U256 = type(uint256).max;

    error ZeroAddress();
    error NotOwnerOrOperator();
    error NotMoriNFT();
    error InvalidNFT();
    error NotOwner();
    error NoLiquidity();
    error InvalidPeriodDuration();
    error NoLMPool();
    error InvalidPid();
    error DuplicatedPool(uint256 pid);
    error NotEmpty();
    error WrongReceiver();
    error InconsistentAmount();
    error DuplicatedRewarder(uint256 pid, IERC20 rewardToken);
    error RewarderNotExist(uint256 pid, address rewardToken);
    error NotEmergency();

    event AddPool(uint256 indexed pid, IMoriV3Pool indexed v3Pool, ILMPool indexed lmPool);
    event AddRewarder(uint256 indexed pid, address indexed rewardToken, uint256 rewardPerSecond, uint256 endTime);
    event UpdateRewarder(uint256 indexed pid, address indexed rewardToken, uint256 rewardPerSecond, uint256 endTime);
    event Deposit(
        address indexed from,
        uint256 indexed pid,
        uint256 indexed tokenId,
        uint256 liquidity,
        int24 tickLower,
        int24 tickUpper
    );
    event Withdraw(address indexed from, address to, uint256 indexed pid, uint256 indexed tokenId);
    event EmergencyWithdraw(address indexed from, address to, uint256 indexed pid, uint256 indexed tokenId);
    event UpdateLiquidity(
        address indexed from,
        uint256 indexed pid,
        uint256 indexed tokenId,
        int128 liquidity,
        int24 tickLower,
        int24 tickUpper
    );
    event NewOperatorAddress(address indexed operator);
    event NewLMPoolDeployerAddress(address indexed deployer);
    event NewVaultAddress(address indexed vault);
    event SetEmergency(bool emergency);
    event UpdateFarmBoostContract(address indexed farmBoostContract);
    event Harvest(
        address indexed sender,
        address to,
        uint256 indexed pid,
        uint256 indexed tokenId,
        address rewardToken,
        uint256 reward
    );

    modifier onlyOwnerOrOperator() {
        if (msg.sender != operatorAddress && msg.sender != owner()) revert NotOwnerOrOperator();
        _;
    }

    /// @param _nonfungiblePositionManager the NFT position manager contract address.
    constructor(INonfungiblePositionManager _nonfungiblePositionManager, address _WETH) {
        nonfungiblePositionManager = _nonfungiblePositionManager;
        WETH = _WETH;
    }

    function setLMPoolDeployer(ILMPoolDeployer _LMPoolDeployer) external onlyOwner {
        if (address(_LMPoolDeployer) == address(0)) revert ZeroAddress();
        LMPoolDeployer = _LMPoolDeployer;
        emit NewLMPoolDeployerAddress(address(_LMPoolDeployer));
    }

    function setVault(IVault _vault) external onlyOwner {
        if (address(_vault) == address(0)) revert ZeroAddress();
        vault = _vault;
        emit NewVaultAddress(address(_vault));
    }

    struct DepositCache {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint128 liquidity;
    }

    function addPool(
        IMoriV3Pool _v3Pool,
        IERC20 _rewardToken,
        uint256 _rewardPerSecond,
        uint256 _duration
    ) external onlyOwner {
        if (address(_v3Pool) == address(0)) revert ZeroAddress();
        if (address(_rewardToken) == address(0)) revert ZeroAddress();
        if (v3PoolAddressPid[address(_v3Pool)] != 0) revert DuplicatedPool(v3PoolAddressPid[address(_v3Pool)]);
        if (_duration > MAX_DURATION || _duration < MIN_DURATION) revert InvalidPeriodDuration();

        address token0 = _v3Pool.token0();
        address token1 = _v3Pool.token1();
        uint24 fee = _v3Pool.fee();
        if (IERC20(token0).allowance(address(this), address(nonfungiblePositionManager)) == 0)
            IERC20(token0).safeApprove(address(nonfungiblePositionManager), type(uint256).max);
        if (IERC20(token1).allowance(address(this), address(nonfungiblePositionManager)) == 0)
            IERC20(token1).safeApprove(address(nonfungiblePositionManager), type(uint256).max);

        ILMPool LMPool = LMPoolDeployer.deploy(_v3Pool);
        LMPool.addRewarder(address(_rewardToken));

        uint256 _pid = ++poolLength;
        v3PoolAddressPid[address(_v3Pool)] = _pid;
        v3PoolPid[token0][token1][fee] = _pid;
        uint256 endTime = block.timestamp + _duration;
        poolInfo[_pid].v3Pool = _v3Pool;
        poolInfo[_pid].token0 = token0;
        poolInfo[_pid].token1 = token1;
        poolInfo[_pid].fee = fee;
        poolInfo[_pid].totalLiquidity = 0;
        poolInfo[_pid].totalBoostLiquidity = 0;
        poolInfo[_pid].latestAccumulateTime = uint32(block.timestamp);
        poolInfo[_pid].rewarderList.push(
            PoolRewarderInfo({
                rewardToken: _rewardToken,
                rewardPerSecond: _rewardPerSecond,
                endTime: uint32(endTime),
                releasedAmount: 0,
                harvestedAmount: 0
            })
        );
        poolRewarderIndex[address(_v3Pool)][address(_rewardToken)] = poolInfo[_pid].rewarderList.length;

        emit AddPool(_pid, _v3Pool, LMPool);
        emit AddRewarder(_pid, address(_rewardToken), _rewardPerSecond, endTime);
    }

    function addRewarder(
        uint256 _pid,
        IERC20 _rewardToken,
        uint256 _rewardPerSecond,
        uint256 _duration
    ) external onlyOwner {
        if (address(_rewardToken) == address(0)) revert ZeroAddress();
        if (_pid == 0 || _pid > poolLength) revert InvalidPid();
        if (_duration > MAX_DURATION || _duration < MIN_DURATION) revert InvalidPeriodDuration();

        // check if rewarder already exists
        IMoriV3Pool _v3Pool = poolInfo[_pid].v3Pool;
        if (poolRewarderIndex[address(_v3Pool)][address(_rewardToken)] != 0)
            revert DuplicatedRewarder(_pid, _rewardToken);

        // accumulate reward
        ILMPool LMPool = ILMPool(poolInfo[_pid].v3Pool.lmPool());
        if (address(LMPool) == address(0)) revert NoLMPool();
        accumulateReward(_pid, uint32(block.timestamp));
        LMPool.addRewarder(address(_rewardToken));

        uint256 endTime = block.timestamp + _duration;
        poolInfo[_pid].rewarderList.push(
            PoolRewarderInfo({
                rewardToken: _rewardToken,
                rewardPerSecond: _rewardPerSecond,
                endTime: uint32(endTime),
                releasedAmount: 0,
                harvestedAmount: 0
            })
        );
        poolRewarderIndex[address(_v3Pool)][address(_rewardToken)] = poolInfo[_pid].rewarderList.length;

        // emit event
        emit AddRewarder(_pid, address(_rewardToken), _rewardPerSecond, endTime);
    }

    function updateRewarder(
        uint256 _pid,
        IERC20 _rewardToken,
        uint256 _rewardPerSecond,
        uint256 _duration
    ) external onlyOwner {
        if (_pid == 0 || _pid > poolLength) revert InvalidPid();
        if (_duration > MAX_DURATION || _duration < MIN_DURATION) revert InvalidPeriodDuration();
        if (address(_rewardToken) == address(0)) revert ZeroAddress();
        if (poolRewarderIndex[address(poolInfo[_pid].v3Pool)][address(_rewardToken)] == 0)
            revert RewarderNotExist(_pid, address(_rewardToken));

        uint32 currentTime = uint32(block.timestamp);

        // accumulate reward
        accumulateReward(_pid, currentTime);

        uint256 _rewardIndex = poolRewarderIndex[address(poolInfo[_pid].v3Pool)][address(_rewardToken)] - 1;
        uint256 endTime = currentTime + _duration;
        poolInfo[_pid].rewarderList[_rewardIndex].rewardPerSecond = _rewardPerSecond;
        poolInfo[_pid].rewarderList[_rewardIndex].endTime = uint32(endTime);

        // emit event
        emit UpdateRewarder(_pid, address(_rewardToken), _rewardPerSecond, endTime);
    }

    function updatePools(uint256[] calldata _pids) external {
        uint32 currentTime = uint32(block.timestamp);
        for (uint256 i = 0; i < _pids.length; i++) {
            uint256 _pid = _pids[i];
            if (_pid == 0 || _pid > poolLength) revert InvalidPid();
            accumulateReward(_pid, currentTime);
        }
    }

    function getRewarderLength(IMoriV3Pool _v3Pool) external view returns (uint256) {
        if (address(_v3Pool) == address(0)) revert ZeroAddress();
        return poolInfo[v3PoolAddressPid[address(_v3Pool)]].rewarderList.length;
    }

    function getRewarderInfo(IMoriV3Pool _v3Pool, uint256 index) external view returns (PoolRewarderInfo memory) {
        if (address(_v3Pool) == address(0)) revert ZeroAddress();
        return poolInfo[v3PoolAddressPid[address(_v3Pool)]].rewarderList[index];
    }

    function getRewarderInfoByPid(uint256 _pid, uint256 index) external view returns (PoolRewarderInfo memory) {
        if (_pid == 0 || _pid > poolLength) revert InvalidPid();
        return poolInfo[_pid].rewarderList[index];
    }

    /// @notice Upon receiving a ERC721
    function onERC721Received(
        address,
        address _from,
        uint256 _tokenId,
        bytes calldata
    ) external nonReentrant returns (bytes4) {
        if (msg.sender != address(nonfungiblePositionManager)) revert NotMoriNFT();
        DepositCache memory cache;
        (
            ,
            ,
            cache.token0,
            cache.token1,
            cache.fee,
            cache.tickLower,
            cache.tickUpper,
            cache.liquidity,
            ,
            ,
            ,

        ) = nonfungiblePositionManager.positions(_tokenId);
        if (cache.liquidity == 0) revert NoLiquidity();
        uint256 pid = v3PoolPid[cache.token0][cache.token1][cache.fee];
        if (pid == 0) revert InvalidNFT();
        PoolInfo memory pool = poolInfo[pid];
        ILMPool LMPool = ILMPool(pool.v3Pool.lmPool());
        if (address(LMPool) == address(0)) revert NoLMPool();

        UserPositionInfo storage positionInfo = userPositionInfos[_tokenId];
        positionInfo.tickLower = cache.tickLower;
        positionInfo.tickUpper = cache.tickUpper;
        positionInfo.user = _from;
        positionInfo.pid = pid;

        accumulateReward(pid, uint32(block.timestamp));
        updateLiquidityOperation(positionInfo, _tokenId, 0);

        for (uint256 i = 0; i < pool.rewarderList.length; i++) {
            PoolRewarderInfo memory rewardInfo = pool.rewarderList[i];
            uint256 rewardGrowthInside = LMPool.getRewardGrowthInside(
                cache.tickLower,
                cache.tickUpper,
                address(rewardInfo.rewardToken)
            );
            positionInfo.rewardInfo[address(rewardInfo.rewardToken)] = PositionRewardInfo({
                rewardGrowthInside: rewardGrowthInside,
                reward: 0
            });
        }

        // Update Enumerable
        addToken(_from, _tokenId);
        emit Deposit(_from, pid, _tokenId, cache.liquidity, cache.tickLower, cache.tickUpper);

        return this.onERC721Received.selector;
    }

    function withdraw(uint256 _tokenId, address _to) external nonReentrant returns (uint256[] memory) {
        if (_to == address(this) || _to == address(0)) revert WrongReceiver();
        UserPositionInfo storage positionInfo = userPositionInfos[_tokenId];
        if (positionInfo.user != msg.sender) revert NotOwner();

        // harvest all rewards
        uint256[] memory rewards = harvestOperation(positionInfo, _tokenId, _to);

        uint256 pid = positionInfo.pid;
        PoolInfo storage pool = poolInfo[pid];
        ILMPool LMPool = ILMPool(pool.v3Pool.lmPool());
        if (address(LMPool) != address(0) && !emergency) {
            // Remove all liquidity from liquidity mining pool.
            int128 liquidityDelta = -int128(positionInfo.boostLiquidity);
            LMPool.updatePosition(positionInfo.tickLower, positionInfo.tickUpper, liquidityDelta);
            emit UpdateLiquidity(
                msg.sender,
                pid,
                _tokenId,
                liquidityDelta,
                positionInfo.tickLower,
                positionInfo.tickUpper
            );
        }
        pool.totalLiquidity -= positionInfo.liquidity;
        pool.totalBoostLiquidity -= positionInfo.boostLiquidity;

        delete userPositionInfos[_tokenId];
        // Update Enumerable
        removeToken(msg.sender, _tokenId);
        // Remove boosted token id in farm booster.
        if (address(FARM_BOOSTER) != address(0)) FARM_BOOSTER.removeBoostMultiplier(msg.sender, _tokenId, pid);
        nonfungiblePositionManager.safeTransferFrom(address(this), _to, _tokenId);
        emit Withdraw(msg.sender, _to, pid, _tokenId);

        return rewards;
    }

    function emergencyWithdraw(uint256 _tokenId, address _to) external nonReentrant {
        if (_to == address(this) || _to == address(0)) revert WrongReceiver();
        UserPositionInfo storage positionInfo = userPositionInfos[_tokenId];
        if (positionInfo.user != msg.sender) revert NotOwner();
        if (!emergency) revert NotEmergency();

        // Update Enumerable
        removeToken(msg.sender, _tokenId);

        uint256 pid = positionInfo.pid;
        delete userPositionInfos[_tokenId];

        // Remove boosted token id in farm booster.
        if (address(FARM_BOOSTER) != address(0)) FARM_BOOSTER.removeBoostMultiplier(msg.sender, _tokenId, pid);

        nonfungiblePositionManager.safeTransferFrom(address(this), _to, _tokenId);
        emit EmergencyWithdraw(msg.sender, _to, pid, _tokenId);
    }

    function burn(uint256 _tokenId) external nonReentrant {
        UserPositionInfo storage positionInfo = userPositionInfos[_tokenId];
        if (positionInfo.user != msg.sender) revert NotOwner();

        // check if position is empty
        bool isRewardEmpty = true;
        PoolInfo storage pool = poolInfo[positionInfo.pid];
        for (uint256 i = 0; i < pool.rewarderList.length; i++) {
            if (positionInfo.rewardInfo[address(pool.rewarderList[i].rewardToken)].reward > 0) {
                isRewardEmpty = false;
                break;
            }
        }
        if (!isRewardEmpty || positionInfo.liquidity > 0) revert NotEmpty();

        delete userPositionInfos[_tokenId];
        // Update Enumerable
        removeToken(msg.sender, _tokenId);
        // Remove boosted token id in farm booster.
        if (address(FARM_BOOSTER) != address(0))
            FARM_BOOSTER.removeBoostMultiplier(msg.sender, _tokenId, positionInfo.pid);
        nonfungiblePositionManager.burn(_tokenId);
        emit Withdraw(msg.sender, address(0), positionInfo.pid, _tokenId);
    }

    function increaseLiquidity(
        IncreaseLiquidityParams memory params
    ) external payable nonReentrant returns (uint128 liquidity, uint256 amount0, uint256 amount1) {
        UserPositionInfo storage positionInfo = userPositionInfos[params.tokenId];
        if (positionInfo.pid == 0) revert InvalidNFT();
        PoolInfo memory pool = poolInfo[positionInfo.pid];
        pay(pool.token0, params.amount0Desired);
        pay(pool.token1, params.amount1Desired);
        if (pool.token0 != WETH && pool.token1 != WETH && msg.value > 0) revert();
        (liquidity, amount0, amount1) = nonfungiblePositionManager.increaseLiquidity{value: msg.value}(params);
        uint256 token0Left = params.amount0Desired - amount0;
        uint256 token1Left = params.amount1Desired - amount1;
        if (token0Left > 0) {
            refund(pool.token0, token0Left);
        }
        if (token1Left > 0) {
            refund(pool.token1, token1Left);
        }

        // harvest all rewards
        harvestOperation(positionInfo, params.tokenId, address(0));
        updateLiquidityOperation(positionInfo, params.tokenId, 0);
    }

    function decreaseLiquidity(
        DecreaseLiquidityParams memory params
    ) external nonReentrant returns (uint256 amount0, uint256 amount1) {
        UserPositionInfo storage positionInfo = userPositionInfos[params.tokenId];
        if (positionInfo.user != msg.sender) revert NotOwner();
        (amount0, amount1) = nonfungiblePositionManager.decreaseLiquidity(params);
        // harvest all rewards
        harvestOperation(positionInfo, params.tokenId, address(0));
        updateLiquidityOperation(positionInfo, params.tokenId, 0);
    }

    function updateLiquidity(uint256 _tokenId) external nonReentrant {
        UserPositionInfo storage positionInfo = userPositionInfos[_tokenId];
        if (positionInfo.pid == 0) revert InvalidNFT();
        harvestOperation(positionInfo, _tokenId, address(0));
        updateLiquidityOperation(positionInfo, _tokenId, 0);
    }

    /// @notice Collects up to a maximum amount of fees owed to a specific position to the recipient
    /// @param params tokenId The ID of the NFT for which tokens are being collected,
    /// recipient The account that should receive the tokens,
    /// amount0Max The maximum amount of token0 to collect,
    /// amount1Max The maximum amount of token1 to collect
    /// @return amount0 The amount of fees collected in token0
    /// @return amount1 The amount of fees collected in token1
    function collect(CollectParams memory params) external nonReentrant returns (uint256 amount0, uint256 amount1) {
        UserPositionInfo storage positionInfo = userPositionInfos[params.tokenId];
        if (positionInfo.user != msg.sender) revert NotOwner();
        address recipient = params.recipient;
        if (recipient == address(0)) recipient = msg.sender;
        params.recipient = address(this);
        (amount0, amount1) = nonfungiblePositionManager.collect(params);

        transferToken(poolInfo[positionInfo.pid].token0, recipient);
        transferToken(poolInfo[positionInfo.pid].token1, recipient);
    }

    function harvest(uint256 _tokenId, address _to) external nonReentrant returns (uint256[] memory) {
        UserPositionInfo storage positionInfo = userPositionInfos[_tokenId];
        if (positionInfo.user != msg.sender) revert NotOwner();

        // Check is rewards is zero
        bool isRewardEmpty = true;
        PoolInfo storage pool = poolInfo[positionInfo.pid];
        for (uint256 i = 0; i < pool.rewarderList.length; i++) {
            if (positionInfo.rewardInfo[address(pool.rewarderList[i].rewardToken)].reward > 0) {
                isRewardEmpty = false;
                break;
            }
        }
        if (isRewardEmpty && positionInfo.liquidity == 0) revert NoLiquidity();

        return harvestOperation(positionInfo, _tokenId, _to);
    }

    function getLatestPeriodInfoByPid(
        uint256 _pid,
        address _rewardToken
    ) public view returns (uint256 rewardPerSecond, uint256 endTime) {
        PoolInfo memory pool = poolInfo[_pid];
        uint256 index = poolRewarderIndex[address(pool.v3Pool)][_rewardToken];
        if (index != 0) {
            uint256 rewardIndex = index - 1;
            if (pool.rewarderList.length <= rewardIndex) {
                return (0, 0);
            }
            PoolRewarderInfo memory poolRewardInfo = pool.rewarderList[rewardIndex];
            rewardPerSecond = poolRewardInfo.rewardPerSecond;
            endTime = poolRewardInfo.endTime;
        }
    }

    function getLatestPeriodInfo(
        address _v3Pool,
        address _rewardToken
    ) public view returns (uint256 rewardPerSecond, uint256 endTime) {
        uint256 pid = v3PoolAddressPid[_v3Pool];
        if (pid != 0) {
            (rewardPerSecond, endTime) = getLatestPeriodInfoByPid(pid, _rewardToken);
        }
    }

    function pendingRewards(uint256 _tokenId) external view returns (uint256[] memory) {
        UserPositionInfo storage positionInfo = userPositionInfos[_tokenId];
        PoolInfo memory pool = poolInfo[positionInfo.pid];
        uint256[] memory rewards = new uint256[](pool.rewarderList.length);
        for (uint256 i = 0; i < pool.rewarderList.length; i++) {
            ILMPool LMPool = ILMPool(pool.v3Pool.lmPool());
            IERC20 rewardToken = pool.rewarderList[i].rewardToken;
            PositionRewardInfo memory positionRewardInfo = positionInfo.rewardInfo[address(rewardToken)];
            rewards[i] = positionRewardInfo.reward;
            if (address(LMPool) != address(0)) {
                uint256 rewardGrowthInside = LMPool.getRewardGrowthInside(
                    positionInfo.tickLower,
                    positionInfo.tickUpper,
                    address(rewardToken)
                );
                if (
                    rewardGrowthInside > positionRewardInfo.rewardGrowthInside &&
                    MAX_U256 / (rewardGrowthInside - positionRewardInfo.rewardGrowthInside) >
                    positionInfo.boostLiquidity
                ) {
                    rewards[i] +=
                        ((rewardGrowthInside - positionRewardInfo.rewardGrowthInside) * positionInfo.boostLiquidity) /
                        Q128;
                }
            }
        }
        return rewards;
    }

    function accumulateReward(uint256 _pid, uint32 _currentTime) internal {
        PoolInfo memory pool = poolInfo[_pid];
        if (_currentTime > pool.latestAccumulateTime) {
            uint256 timeElapsed = _currentTime - pool.latestAccumulateTime;
            poolInfo[_pid].latestAccumulateTime = _currentTime;
            ILMPool LMPool = ILMPool(pool.v3Pool.lmPool());
            if (address(LMPool) != address(0)) {
                LMPool.accumulateReward(_currentTime);
                for (uint256 i = 0; i < pool.rewarderList.length; i++) {
                    PoolRewarderInfo memory poolRewardInfo = pool.rewarderList[i];
                    uint256 rewardPerSecond = poolRewardInfo.rewardPerSecond;
                    uint256 endTime = poolRewardInfo.endTime;
                    if (rewardPerSecond > 0 && _currentTime < endTime) {
                        poolInfo[_pid].rewarderList[i].releasedAmount += rewardPerSecond * timeElapsed;
                    }
                }
            }
        }
    }

    function harvestOperation(
        UserPositionInfo storage positionInfo,
        uint256 _tokenId,
        address _to
    ) internal returns (uint256[] memory) {
        PoolInfo memory pool = poolInfo[positionInfo.pid];
        // accumulate reward
        ILMPool LMPool = ILMPool(pool.v3Pool.lmPool());
        if (address(LMPool) != address(0) && !emergency) {
            accumulateReward(positionInfo.pid, uint32(block.timestamp));
        }

        uint256[] memory rewards = new uint256[](pool.rewarderList.length);
        for (uint256 i = 0; i < pool.rewarderList.length; i++) {
            PoolRewarderInfo memory poolRewardInfo = pool.rewarderList[i];
            address rewardToken = address(poolRewardInfo.rewardToken);
            uint256 reward = positionInfo.rewardInfo[rewardToken].reward;
            if (address(LMPool) != address(0) && !emergency) {
                if (positionInfo.rewardInfo[rewardToken].reward == 0 && positionInfo.liquidity == 0) {
                    continue;
                }

                uint256 rewardGrowthInside = LMPool.getRewardGrowthInside(
                    positionInfo.tickLower,
                    positionInfo.tickUpper,
                    rewardToken
                );
                if (
                    rewardGrowthInside > positionInfo.rewardInfo[rewardToken].rewardGrowthInside &&
                    MAX_U256 / (rewardGrowthInside - positionInfo.rewardInfo[rewardToken].rewardGrowthInside) >
                    positionInfo.boostLiquidity
                ) {
                    reward +=
                        ((rewardGrowthInside - positionInfo.rewardInfo[rewardToken].rewardGrowthInside) *
                            positionInfo.boostLiquidity) /
                        Q128;
                    positionInfo.rewardInfo[rewardToken].rewardGrowthInside = rewardGrowthInside;
                }
            }
            rewards[i] = reward;
            if (reward > 0) {
                if (_to != address(0)) {
                    poolInfo[positionInfo.pid].rewarderList[i].harvestedAmount += reward;
                    positionInfo.rewardInfo[rewardToken].reward = 0;
                    vault.safeTransfer(rewardToken, _to, reward);
                    emit Harvest(msg.sender, _to, positionInfo.pid, _tokenId, rewardToken, reward);
                } else {
                    positionInfo.rewardInfo[rewardToken].reward = reward;
                }
            }
        }
        return rewards;
    }

    function updateLiquidityOperation(
        UserPositionInfo storage positionInfo,
        uint256 _tokenId,
        uint256 _newMultiplier
    ) internal {
        (, , , , , int24 tickLower, int24 tickUpper, uint128 liquidity, , , , ) = nonfungiblePositionManager.positions(
            _tokenId
        );
        PoolInfo storage pool = poolInfo[positionInfo.pid];
        if (positionInfo.liquidity != liquidity) {
            pool.totalLiquidity = pool.totalLiquidity - positionInfo.liquidity + liquidity;
            positionInfo.liquidity = liquidity;
        }
        uint256 boostMultiplier = BOOST_PRECISION;
        if (address(FARM_BOOSTER) != address(0) && _newMultiplier == 0) {
            // Get the latest boostMultiplier and update boostMultiplier in farm booster.
            boostMultiplier = FARM_BOOSTER.updatePositionBoostMultiplier(_tokenId);
        } else if (_newMultiplier != 0) {
            // Update boostMultiplier from farm booster call.
            boostMultiplier = _newMultiplier;
        }

        if (boostMultiplier < BOOST_PRECISION) {
            boostMultiplier = BOOST_PRECISION;
        } else if (boostMultiplier > MAX_BOOST_PRECISION) {
            boostMultiplier = MAX_BOOST_PRECISION;
        }

        positionInfo.boostMultiplier = boostMultiplier;
        uint128 boostLiquidity = ((uint256(liquidity) * boostMultiplier) / BOOST_PRECISION).toUint128();
        int128 liquidityDelta = int128(boostLiquidity) - int128(positionInfo.boostLiquidity);
        if (liquidityDelta != 0) {
            pool.totalBoostLiquidity = pool.totalBoostLiquidity - positionInfo.boostLiquidity + boostLiquidity;
            positionInfo.boostLiquidity = boostLiquidity;
            ILMPool LMPool = ILMPool(pool.v3Pool.lmPool());
            if (address(LMPool) == address(0)) revert NoLMPool();
            LMPool.updatePosition(tickLower, tickUpper, liquidityDelta);
            emit UpdateLiquidity(msg.sender, positionInfo.pid, _tokenId, liquidityDelta, tickLower, tickUpper);
        }
    }

    function setOperator(address _operatorAddress) external onlyOwner {
        if (_operatorAddress == address(0)) revert ZeroAddress();
        operatorAddress = _operatorAddress;
        emit NewOperatorAddress(_operatorAddress);
    }

    /// @notice For emergency use only.
    function setEmergency(bool _emergency) external onlyOwner {
        emergency = _emergency;
        emit SetEmergency(emergency);
    }

    /// @notice Update farm boost contract address.
    /// @param _newFarmBoostContract The new farm booster address.
    function updateFarmBoostContract(address _newFarmBoostContract) external onlyOwner {
        // farm booster can be zero address when need to remove farm booster
        FARM_BOOSTER = IFarmBooster(_newFarmBoostContract);
        emit UpdateFarmBoostContract(_newFarmBoostContract);
    }

    /// @notice Pay.
    /// @param _token The token to pay
    /// @param _amount The amount to pay
    function pay(address _token, uint256 _amount) internal {
        if (_token == WETH && msg.value > 0) {
            if (msg.value != _amount) revert InconsistentAmount();
        } else {
            IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        }
    }

    function transferToken(address _token, address _to) internal {
        uint256 balance = IERC20(_token).balanceOf(address(this));
        if (balance > 0) {
            if (_token == WETH) {
                IWETH(WETH).withdraw(balance);
                safeTransferETH(_to, balance);
            } else {
                IERC20(_token).safeTransfer(_to, balance);
            }
        }
    }

    /// @notice Refund.
    /// @param _token The token to refund
    /// @param _amount The amount to refund
    function refund(address _token, uint256 _amount) internal {
        if (_token == WETH && msg.value > 0) {
            nonfungiblePositionManager.refundETH();
            safeTransferETH(msg.sender, address(this).balance);
        } else {
            IERC20(_token).safeTransfer(msg.sender, _amount);
        }
    }

    /**
     * @notice Transfer ETH in a safe way
     * @param to: address to transfer ETH to
     * @param value: ETH amount to transfer (in wei)
     */
    function safeTransferETH(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}("");
        if (!success) revert();
    }

    receive() external payable {
        if (msg.sender != address(nonfungiblePositionManager) && msg.sender != WETH) revert();
    }
}
