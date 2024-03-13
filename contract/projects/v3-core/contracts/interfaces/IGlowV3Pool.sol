// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.5.0;

import './pool/IMoriV3PoolImmutables.sol';
import './pool/IMoriV3PoolState.sol';
import './pool/IMoriV3PoolDerivedState.sol';
import './pool/IMoriV3PoolActions.sol';
import './pool/IMoriV3PoolOwnerActions.sol';
import './pool/IMoriV3PoolEvents.sol';

/// @title The interface for a MoriSwap V3 Pool
/// @notice A MoriSwap pool facilitates swapping and automated market making between any two assets that strictly conform
/// to the ERC20 specification
/// @dev The pool interface is broken up into many smaller pieces
interface IMoriV3Pool is
    IMoriV3PoolImmutables,
    IMoriV3PoolState,
    IMoriV3PoolDerivedState,
    IMoriV3PoolActions,
    IMoriV3PoolOwnerActions,
    IMoriV3PoolEvents
{

}
