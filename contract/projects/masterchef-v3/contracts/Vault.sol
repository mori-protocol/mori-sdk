// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Vault is Ownable {
    using SafeERC20 for IERC20;

    address public immutable masterChef;
    address public immutable WETH;

    constructor(address _masterChef, address _WETH) {
        masterChef = _masterChef;
        WETH = _WETH;
    }

    modifier onlyMasterChef() {
        require(msg.sender == masterChef, "Vault: caller is not the masterChef");
        _;
    }

    fallback() external payable {}

    receive() external payable {}

    function safeTransfer(
        IERC20 _token,
        address _to,
        uint256 _amount
    ) external onlyMasterChef {
        require(_to != address(0), "Vault: to is the zero address");

        if (address(_token) == WETH) {
            (bool success, ) = _to.call{value: _amount}(new bytes(0));
            require(success, "Vault: ETH transfer failed");
        } else {
            _token.safeTransfer(_to, _amount);
        }
    }

    function emergencyWithdraw(IERC20 _token, address _to) external onlyOwner {
        require(_to != address(0), "Vault: to is the zero address");
        uint256 amount = _token.balanceOf(address(this));
        _token.safeTransfer(_to, amount);
    }

    function emergencyWithdrawETH(address _to) external onlyOwner {
        require(_to != address(0), "Vault: to is the zero address");
        (bool success, ) = _to.call{value: address(this).balance}(new bytes(0));
        require(success, "Vault: ETH transfer failed");
    }
}
