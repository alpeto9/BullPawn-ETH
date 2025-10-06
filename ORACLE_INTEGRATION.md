# Oracle Integration Guide

This document explains how to integrate and use the realistic Chainlink oracle system in your pawn protocol.

## Overview

The oracle system has been upgraded from a simple mock to a production-ready Chainlink integration that provides:

- **Real-time price data** from Chainlink's decentralized oracle network
- **Price validation** with circuit breakers and deviation checks
- **Fallback mechanisms** for reliability
- **Health monitoring** for oracle status

## Architecture

### Components

1. **ChainlinkPriceFeed.sol** - Wrapper contract that implements the IPriceFeed interface
2. **IPriceFeed.sol** - Standardized interface for price feeds
3. **PawnSystem.sol** - Updated to use the new oracle interface
4. **Backend Integration** - Updated to handle real oracle data

### Chainlink Price Feed Addresses (zkSync Sepolia Testnet)

| Pair | Address | Deviation | Heartbeat |
|------|---------|-----------|-----------|
| ETH/USD | `0xfEefF7c3fB57d18C5C6Cdd71e45D2D0b4F9377bF` | 0.5% | 86400s |
| BTC/USD | `0x95Bc57e794aeb02E4a16eff406147f3ce2531F83` | 0.5% | 86400s |
| USDT/USD | `0x07F05C2aFeb54b68Ea425CAbCcbF53E2d5605d76` | 0.3% | 86400s |
| USDC/USD | `0x1844478CA634f3a762a2E71E3386837Bd50C947F` | 0.3% | 86400s |
| DAI/USD | `0x3aE81863E2F4cdea95b0c96E9C3C71cf1e10EFFE` | 0.3% | 86400s |
| LINK/USD | `0x894423C43cD7230Cd22a47B329E96097e6355292` | 0.5% | 86400s |
| LINK/ETH | `0x77167bC91489B60a831d77e7E845e610f0d7D215` | 0.5% | 86400s |

## Features

### Price Validation
- **Positive Price Check**: Ensures prices are greater than zero
- **Age Validation**: Rejects prices older than 24 hours (based on heartbeat)
- **Deviation Check**: Prevents price manipulation with 10% max deviation
- **Circuit Breaker**: Uses last valid price if current price fails validation

### Fallback Mechanisms
- **Oracle Fallback**: Falls back to CoinGecko API if Chainlink fails
- **Price Fallback**: Uses $2000/ETH if all sources fail
- **Health Monitoring**: Continuous monitoring of oracle health status

### Security Features
- **Reentrancy Protection**: All functions are protected against reentrancy
- **Access Control**: Only owner can pause/unpause the system
- **Input Validation**: Comprehensive validation of all inputs
- **Error Handling**: Graceful error handling with informative messages

## Deployment

### Prerequisites
1. Set up your environment variables in `.env`:
```bash
PRIVATE_KEY=your_private_key_here
ZKSYNC_RPC_URL=https://sepolia.era.zksync.dev
```

2. Ensure you have sufficient ETH for deployment (minimum 0.01 ETH)

### Deploy with Chainlink Oracle
```bash
cd contracts
node scripts/deploy-chainlink-oracle.js
```

This script will:
1. Deploy MockUSDT contract
2. Deploy ChainlinkPriceFeed wrapper with ETH/USD feed
3. Deploy PawnSystem with oracle integration
4. Test the oracle connection
5. Update your `.env` file with contract addresses

### Environment Variables
After deployment, your `.env` file will be updated with:
```bash
PAWN_CONTRACT_ADDRESS=0x...
USDT_CONTRACT_ADDRESS=0x...
ORACLE_CONTRACT_ADDRESS=0x...
CHAINLINK_ETH_USD_FEED=0xfEefF7c3fB57d18C5C6Cdd71e45D2D0b4F9377bF
```

## Usage

### Smart Contract Functions

#### Get Current ETH Price
```solidity
function getETHPrice() public view returns (uint256)
```
Returns the current ETH price in USDT units (6 decimals) with validation.

#### Check Oracle Health
```solidity
function isPriceFeedHealthy() external view returns (bool)
```
Returns true if the oracle is healthy and providing valid data.

#### Get Price Feed Info
```solidity
function getPriceFeedInfo() external view returns (uint8 decimals, string memory description)
```
Returns information about the price feed.

### Backend API

#### Get Oracle Price
```typescript
const price = await blockchainService.getOraclePrice();
```

#### Check Oracle Health
```typescript
const isHealthy = await blockchainService.isOracleHealthy();
```

#### Get Oracle Information
```typescript
const info = await blockchainService.getOracleInfo();
```

#### Get Latest Round Data
```typescript
const roundData = await blockchainService.getLatestRoundData();
```

## Monitoring

### Oracle Health Checks
The system continuously monitors:
- Price freshness (not older than 24 hours)
- Price validity (positive values)
- Price stability (within 10% deviation)
- Oracle connectivity

### Events
The system emits events for monitoring:
- `PriceUpdated`: When a new valid price is received
- `PriceValidationFailed`: When price validation fails

### Logging
The backend logs:
- Oracle price fetches
- Fallback activations
- Health check results
- Error conditions

## Production Considerations

### For Mainnet Deployment
1. **Replace MockUSDT** with real USDT contract
2. **Use Mainnet Chainlink Feeds** (different addresses)
3. **Implement Multi-Oracle** for redundancy
4. **Add Emergency Pause** functionality
5. **Set up Monitoring** and alerting

### Security Best Practices
1. **Regular Health Checks**: Monitor oracle health continuously
2. **Price Deviation Alerts**: Set up alerts for unusual price movements
3. **Backup Oracles**: Consider multiple oracle sources
4. **Circuit Breakers**: Implement additional safety mechanisms
5. **Access Control**: Limit admin functions to multisig wallets

### Performance Optimization
1. **Gas Optimization**: Use efficient data structures
2. **Caching**: Cache frequently accessed data
3. **Batch Operations**: Group related operations
4. **Event Filtering**: Use indexed events for efficient querying

## Troubleshooting

### Common Issues

#### Oracle Not Responding
- Check network connectivity
- Verify oracle address is correct
- Check if oracle is paused or deprecated

#### Price Validation Failing
- Check if price is within acceptable range
- Verify price is not too old
- Check for oracle maintenance

#### Deployment Failures
- Ensure sufficient ETH balance
- Verify private key is correct
- Check network status

### Debug Commands
```bash
# Check oracle health
npx hardhat run scripts/check-oracle-health.js

# Get current price
npx hardhat run scripts/get-current-price.js

# Test oracle connection
npx hardhat run scripts/test-oracle.js
```

## Support

For issues or questions:
1. Check the logs for error messages
2. Verify oracle addresses are correct
3. Ensure sufficient gas and ETH balance
4. Check Chainlink documentation for oracle status

## References

- [Chainlink Documentation](https://docs.chain.link/data-feeds/price-feeds)
- [zkSync Era Documentation](https://era.zksync.io/docs/)
- [Chainlink Price Feed Addresses](https://docs.chain.link/data-feeds/price-feeds/addresses?network=zksync)
