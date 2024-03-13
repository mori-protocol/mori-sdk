// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./IMoriV3Pool.sol";
import "./ILMPool.sol";

interface ILMPoolDeployer {
    function deploy(IMoriV3Pool pool) external returns (ILMPool lmPool);
}
