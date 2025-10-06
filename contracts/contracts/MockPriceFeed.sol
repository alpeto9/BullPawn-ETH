// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IPriceFeed.sol";

contract MockPriceFeed is IPriceFeed {
    int256 public price;
    uint8 public constant decimals = 8; // Chainlink standard
    string public constant description = "ETH / USD";
    
    constructor(int256 _initialPrice) {
        price = _initialPrice;
    }
    
    function latestRoundData() external view override returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (
            1, // roundId
            price, // answer
            block.timestamp, // startedAt
            block.timestamp, // updatedAt
            1 // answeredInRound
        );
    }
    
    function updatePrice(int256 _newPrice) external {
        price = _newPrice;
    }
    
    function getLatestPrice() external view override returns (int256) {
        return price;
    }
    
    function isPriceFeedHealthy() external view override returns (bool) {
        return price > 0;
    }
}
