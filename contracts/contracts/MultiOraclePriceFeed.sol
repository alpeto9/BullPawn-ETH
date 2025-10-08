// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IPriceFeed.sol";

/**
 * @title MultiOraclePriceFeed
 * @dev Aggregates multiple price feeds with weighted average and failover
 * @notice Provides robust price data with multiple oracle sources
 */
contract MultiOraclePriceFeed is IPriceFeed {
    
    struct OracleSource {
        IPriceFeed priceFeed;
        bool isActive;
        uint256 weight; // Weight for weighted average (1-100)
        uint256 lastUpdate;
        int256 lastPrice;
        bool isHealthy;
    }
    
    OracleSource[] public oracles;
    address public owner;
    
    // Configuration
    uint256 public constant MAX_ORACLES = 10;
    uint256 public constant MIN_ORACLES = 2;
    uint256 public constant MAX_PRICE_DEVIATION = 15; // 15% max deviation
    uint256 public constant MAX_PRICE_AGE = 3600; // 1 hour
    uint256 public constant MIN_WEIGHT = 1;
    uint256 public constant MAX_WEIGHT = 100;
    
    // Fallback price (in case all oracles fail)
    int256 public fallbackPrice;
    uint256 public fallbackPriceTimestamp;
    
    // Events
    event OracleAdded(address indexed oracle, uint256 weight);
    event OracleRemoved(address indexed oracle);
    event OracleUpdated(address indexed oracle, bool active, uint256 weight);
    event FallbackPriceSet(int256 price, uint256 timestamp);
    event PriceUpdated(int256 newPrice, uint256 timestamp);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(int256 _fallbackPrice) {
        owner = msg.sender;
        fallbackPrice = _fallbackPrice;
        fallbackPriceTimestamp = block.timestamp;
    }
    
    // ============ ORACLE MANAGEMENT ============
    
    function addOracle(address _oracle, uint256 _weight) external onlyOwner {
        require(_oracle != address(0), "Invalid oracle address");
        require(_weight >= MIN_WEIGHT && _weight <= MAX_WEIGHT, "Invalid weight");
        require(oracles.length < MAX_ORACLES, "Too many oracles");
        
        oracles.push(OracleSource({
            priceFeed: IPriceFeed(_oracle),
            isActive: true,
            weight: _weight,
            lastUpdate: 0,
            lastPrice: 0,
            isHealthy: true
        }));
        
        emit OracleAdded(_oracle, _weight);
    }
    
    function removeOracle(uint256 _index) external onlyOwner {
        require(_index < oracles.length, "Invalid oracle index");
        require(oracles.length > MIN_ORACLES, "Cannot remove oracle - minimum required");
        
        emit OracleRemoved(address(oracles[_index].priceFeed));
        
        // Move last oracle to this position
        oracles[_index] = oracles[oracles.length - 1];
        oracles.pop();
    }
    
    function updateOracle(uint256 _index, bool _active, uint256 _weight) external onlyOwner {
        require(_index < oracles.length, "Invalid oracle index");
        require(_weight >= MIN_WEIGHT && _weight <= MAX_WEIGHT, "Invalid weight");
        
        oracles[_index].isActive = _active;
        oracles[_index].weight = _weight;
        
        emit OracleUpdated(address(oracles[_index].priceFeed), _active, _weight);
    }
    
    function setFallbackPrice(int256 _price) external onlyOwner {
        require(_price > 0, "Invalid fallback price");
        fallbackPrice = _price;
        fallbackPriceTimestamp = block.timestamp;
        emit FallbackPriceSet(_price, block.timestamp);
    }
    
    // ============ PRICE AGGREGATION ============
    
    function getLatestPrice() external view override returns (int256) {
        return _getAggregatedPrice();
    }
    
    function _getAggregatedPrice() internal view returns (int256) {
        require(oracles.length >= MIN_ORACLES, "Insufficient oracles");
        
        uint256 totalWeight = 0;
        uint256 weightedPriceSum = 0;
        uint256 validOracles = 0;
        
        // Collect prices from all active oracles
        for (uint256 i = 0; i < oracles.length; i++) {
            if (oracles[i].isActive) {
                try oracles[i].priceFeed.getLatestPrice() returns (int256 price) {
                    if (_isValidPrice(price, oracles[i].lastPrice)) {
                        weightedPriceSum += uint256(price) * oracles[i].weight;
                        totalWeight += oracles[i].weight;
                        validOracles++;
                    }
                } catch {
                    // Skip failed oracle
                    continue;
                }
            }
        }
        
        // Check if we have enough valid oracles
        if (validOracles < MIN_ORACLES) {
            return fallbackPrice;
        }
        
        return int256(weightedPriceSum / totalWeight);
    }
    
    function _isValidPrice(int256 _newPrice, int256 _lastPrice) internal pure returns (bool) {
        // Check if price is positive
        if (_newPrice <= 0) {
            return false;
        }
        
        // Check deviation from last price (if available)
        if (_lastPrice > 0) {
            uint256 deviation = _calculateDeviation(_newPrice, _lastPrice);
            if (deviation > MAX_PRICE_DEVIATION) {
                return false;
            }
        }
        
        return true;
    }
    
    function _calculateDeviation(int256 _newPrice, int256 _oldPrice) internal pure returns (uint256) {
        if (_oldPrice == 0) return 0;
        
        uint256 absDiff = _newPrice > _oldPrice ? 
            uint256(_newPrice - _oldPrice) : 
            uint256(_oldPrice - _newPrice);
            
        return (absDiff * 100) / uint256(_oldPrice);
    }
    
    // ============ ORACLE HEALTH MONITORING ============
    
    function updateOracleHealth() external {
        for (uint256 i = 0; i < oracles.length; i++) {
            if (oracles[i].isActive) {
                try oracles[i].priceFeed.getLatestPrice() returns (int256 price) {
                    if (price > 0) {
                        oracles[i].lastPrice = price;
                        oracles[i].lastUpdate = block.timestamp;
                        oracles[i].isHealthy = true;
                    } else {
                        oracles[i].isHealthy = false;
                    }
                } catch {
                    oracles[i].isHealthy = false;
                }
            }
        }
    }
    
    function isPriceFeedHealthy() external view override returns (bool) {
        uint256 healthyOracles = 0;
        
        for (uint256 i = 0; i < oracles.length; i++) {
            if (oracles[i].isActive && oracles[i].isHealthy) {
                healthyOracles++;
            }
        }
        
        return healthyOracles >= MIN_ORACLES;
    }
    
    // ============ VIEW FUNCTIONS ============
    
    function getOracleCount() external view returns (uint256) {
        return oracles.length;
    }
    
    function getOracleInfo(uint256 _index) external view returns (
        address oracle,
        bool isActive,
        uint256 weight,
        uint256 lastUpdate,
        int256 lastPrice,
        bool isHealthy
    ) {
        require(_index < oracles.length, "Invalid oracle index");
        
        OracleSource memory oracleSource = oracles[_index];
        return (
            address(oracleSource.priceFeed),
            oracleSource.isActive,
            oracleSource.weight,
            oracleSource.lastUpdate,
            oracleSource.lastPrice,
            oracleSource.isHealthy
        );
    }
    
    function getSystemHealth() external view returns (
        uint256 totalOracles,
        uint256 activeOracles,
        uint256 healthyOracles,
        bool isSystemHealthy
    ) {
        totalOracles = oracles.length;
        activeOracles = 0;
        healthyOracles = 0;
        
        for (uint256 i = 0; i < oracles.length; i++) {
            if (oracles[i].isActive) {
                activeOracles++;
                if (oracles[i].isHealthy) {
                    healthyOracles++;
                }
            }
        }
        
        isSystemHealthy = healthyOracles >= MIN_ORACLES;
    }
    
    // ============ IPriceFeed INTERFACE ============
    
    function latestRoundData() external view override returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        // Return aggregated data - use first oracle for round info
        if (oracles.length > 0 && oracles[0].isActive) {
            try oracles[0].priceFeed.latestRoundData() returns (
                uint80 _roundId,
                int256 _answer,
                uint256 _startedAt,
                uint256 _updatedAt,
                uint80 _answeredInRound
            ) {
                return (
                    _roundId,
                    _getAggregatedPrice(), // Use our aggregated price
                    _startedAt,
                    _updatedAt,
                    _answeredInRound
                );
            } catch {
                // Fallback to basic data
                return (
                    0,
                    _getAggregatedPrice(),
                    block.timestamp,
                    block.timestamp,
                    0
                );
            }
        }
        
        // Fallback if no oracles
        return (
            0,
            fallbackPrice,
            block.timestamp,
            block.timestamp,
            0
        );
    }
    
    function decimals() external view override returns (uint8) {
        // Return decimals from first oracle, or default to 8
        if (oracles.length > 0 && oracles[0].isActive) {
            try oracles[0].priceFeed.decimals() returns (uint8 _decimals) {
                return _decimals;
            } catch {
                return 8; // Default Chainlink decimals
            }
        }
        return 8;
    }
    
    function description() external view override returns (string memory) {
        return "Multi-Oracle Price Feed Aggregator";
    }
}
