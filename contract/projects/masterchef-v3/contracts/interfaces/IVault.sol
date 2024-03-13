// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

interface IVault {
    function safeTransfer(
        address _token,
        address _to,
        uint256 _amount
    ) external;
}
