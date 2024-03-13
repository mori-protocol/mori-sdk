// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;

interface IMasterChefV3 {
    function nonfungiblePositionManager() external view returns (address);

    function getLatestPeriodInfo(address _v3Pool, address rewarder)
        external
        view
        returns (uint256 cakePerSecond, uint256 endTime);
}
