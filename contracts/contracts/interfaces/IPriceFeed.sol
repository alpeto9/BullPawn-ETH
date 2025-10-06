// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IPriceFeed {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
    
    function decimals() external view returns (uint8);
    
    function description() external view returns (string memory);
    
    function getLatestPrice() external view returns (int256);
    
    function isPriceFeedHealthy() external view returns (bool);
}
