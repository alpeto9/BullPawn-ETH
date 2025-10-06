// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Simplified interface to avoid dependency issues
interface AggregatorV3Interface {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
    function decimals() external view returns (uint8);
    function description() external view returns (string memory);
    function version() external view returns (uint256);
    function phaseId() external view returns (uint16);
}
import "./interfaces/IPriceFeed.sol";

/**
 * @title ChainlinkPriceFeed
 * @dev Wrapper contract that implements IPriceFeed interface using Chainlink AggregatorV3Interface
 * @notice This contract provides a standardized interface for Chainlink price feeds
 */
contract ChainlinkPriceFeed is IPriceFeed {
    AggregatorV3Interface public immutable priceFeed;
    
    // Circuit breaker parameters
    uint256 public constant MAX_PRICE_DEVIATION = 10; // 10% max deviation
    uint256 public constant PRICE_FEED_TIMEOUT = 3600; // 1 hour
    uint256 public constant MAX_PRICE_AGE = 86400; // 24 hours (based on heartbeat)
    
    // Price validation
    int256 public lastValidPrice;
    uint256 public lastValidTimestamp;
    
    event PriceUpdated(int256 newPrice, uint256 timestamp);
    event PriceValidationFailed(string reason);
    
    constructor(address _priceFeedAddress) {
        require(_priceFeedAddress != address(0), "Invalid price feed address");
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
        
        // Initialize with first valid price
        _updateLastValidPrice();
    }
    
    /**
     * @dev Returns the latest round data from Chainlink
     * @return roundId The round ID
     * @return answer The price answer
     * @return startedAt When the round started
     * @return updatedAt When the round was updated
     * @return answeredInRound The round in which the answer was computed
     */
    function latestRoundData() external view override returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return priceFeed.latestRoundData();
    }
    
    /**
     * @dev Returns the number of decimals for the price feed
     * @return The number of decimals
     */
    function decimals() external view override returns (uint8) {
        return priceFeed.decimals();
    }
    
    /**
     * @dev Returns the description of the price feed
     * @return The description string
     */
    function description() external view override returns (string memory) {
        return priceFeed.description();
    }
    
    /**
     * @dev Returns the latest price with validation
     * @return The validated price
     */
    function getLatestPrice() external view returns (int256) {
        return _getValidatedPrice();
    }
    
    /**
     * @dev Checks if the price feed is healthy
     * @return True if the price feed is healthy, false otherwise
     */
    function isPriceFeedHealthy() external view returns (bool) {
        try priceFeed.latestRoundData() returns (
            uint80,
            int256 price,
            uint256,
            uint256 updatedAt,
            uint80
        ) {
            // Check if price is positive
            if (price <= 0) {
                return false;
            }
            
            // Check if price is not too old
            if (block.timestamp - updatedAt > MAX_PRICE_AGE) {
                return false;
            }
            
            // Check if price deviation is within acceptable range
            if (lastValidPrice > 0) {
                uint256 deviation = _calculateDeviation(price, lastValidPrice);
                if (deviation > MAX_PRICE_DEVIATION) {
                    return false;
                }
            }
            
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * @dev Updates the last valid price (can be called by anyone to refresh)
     */
    function updateLastValidPrice() external {
        _updateLastValidPrice();
    }
    
    /**
     * @dev Internal function to get validated price
     * @return The validated price or fallback price
     */
    function _getValidatedPrice() internal view returns (int256) {
        try priceFeed.latestRoundData() returns (
            uint80,
            int256 price,
            uint256,
            uint256 updatedAt,
            uint80
        ) {
            // Check if price is positive
            if (price <= 0) {
                return lastValidPrice > 0 ? lastValidPrice : int256(2000 * 1e8); // Fallback to $2000
            }
            
            // Check if price is not too old
            if (block.timestamp - updatedAt > MAX_PRICE_AGE) {
                return lastValidPrice > 0 ? lastValidPrice : int256(2000 * 1e8); // Fallback to $2000
            }
            
            // Check if price deviation is within acceptable range
            if (lastValidPrice > 0) {
                uint256 deviation = _calculateDeviation(price, lastValidPrice);
                if (deviation > MAX_PRICE_DEVIATION) {
                    return lastValidPrice; // Use last valid price if deviation is too high
                }
            }
            
            return price;
        } catch {
            return lastValidPrice > 0 ? lastValidPrice : int256(2000 * 1e8); // Fallback to $2000
        }
    }
    
    /**
     * @dev Internal function to update the last valid price
     */
    function _updateLastValidPrice() internal {
        try priceFeed.latestRoundData() returns (
            uint80,
            int256 price,
            uint256,
            uint256 updatedAt,
            uint80
        ) {
            if (price > 0 && (block.timestamp - updatedAt) <= MAX_PRICE_AGE) {
                lastValidPrice = price;
                lastValidTimestamp = updatedAt;
                emit PriceUpdated(price, updatedAt);
            }
        } catch {
            emit PriceValidationFailed("Failed to fetch price from Chainlink");
        }
    }
    
    /**
     * @dev Calculates the percentage deviation between two prices
     * @param newPrice The new price
     * @param oldPrice The old price
     * @return The percentage deviation
     */
    function _calculateDeviation(int256 newPrice, int256 oldPrice) internal pure returns (uint256) {
        if (oldPrice == 0) return 0;
        
        uint256 absDiff = newPrice > oldPrice ? 
            uint256(newPrice - oldPrice) : 
            uint256(oldPrice - newPrice);
            
        return (absDiff * 100) / uint256(oldPrice);
    }
    
    /**
     * @dev Returns additional price feed information
     * @return version The version of the price feed
     * @return roundId The latest round ID
     * @return phaseId The phase ID
     */
    function getPriceFeedInfo() external view returns (
        uint256 version,
        uint80 roundId,
        uint16 phaseId
    ) {
        version = priceFeed.version();
        (roundId, , , , ) = priceFeed.latestRoundData();
        phaseId = priceFeed.phaseId();
    }
}
