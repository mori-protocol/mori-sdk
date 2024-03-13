// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

interface ILMPool {
    function updatePosition(
        int24 tickLower,
        int24 tickUpper,
        int128 liquidityDelta
    ) external;

    function getRewardGrowthInside(
        int24 tickLower,
        int24 tickUpper,
        address rewardToken
    ) external view returns (uint256 rewardGrowthInsideX128);

    function accumulateReward(uint32 currTimestamp) external;

    function addRewarder(address rewardToken) external;
}
