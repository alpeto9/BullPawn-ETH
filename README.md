# 🏦 BullPawn - Decentralized Pawn Protocol with Real Chainlink Oracles

**⚠️ EDUCATIONAL PROJECT - NOT FOR PRODUCTION USE**

A decentralized pawn protocol built on zkSync Era for educational purposes, featuring real-time Chainlink oracle integration to demonstrate DeFi concepts and smart contract development.

## 🌟 Features

### 🔗 **Real Oracle Integration**
- **Live Chainlink Price Feeds** on zkSync Sepolia testnet
- **Real-time ETH/USD pricing** from decentralized oracle network
- **Price validation** with circuit breakers and deviation checks
- **Fallback mechanisms** for maximum reliability

### 💰 **Pawn Protocol**
- **70% Loan-to-Value (LTV)** ratio for ETH collateral
- **10% interest rate** on loans
- **1-year loan duration** with early redemption options
- **Automatic liquidation** when collateral value drops below threshold

### 🛡️ **Security Features**
- **Reentrancy protection** on all functions
- **Price feed validation** with age and deviation checks
- **Circuit breakers** for price manipulation protection
- **Pausable contracts** for emergency situations

### 🎨 **Modern UI/UX**
- **Responsive React frontend** with Material-UI components
- **Real-time transaction feedback** in modal dialogs
- **Wallet integration** with MetaMask support
- **Live price updates** from Chainlink oracles

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │   Smart         │
│   (React)       │◄──►│   (Node.js)      │◄──►│   Contracts     │
│                 │    │                  │    │   (Solidity)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   Docker         │    │   Chainlink     │
                       │   Containers     │    │   Oracles       │
                       └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- MetaMask wallet
- zkSync Sepolia testnet ETH

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/bullpawn.git
cd bullpawn
```

### 2. Environment Setup
```bash
cp env.example .env
# Edit .env with your private key and configuration
```

### 3. Deploy Contracts
```bash
# Deploy with real Chainlink oracle integration
PRIVATE_KEY=your_private_key node scripts/deploy-chainlink-oracle.js
```

### 4. Start the Application
```bash
# Start all services with Docker
docker-compose up --build -d
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:9001
- **Health Check**: http://localhost:9001/health

## 📊 Oracle Integration

### Chainlink Price Feeds (zkSync Sepolia)
| Asset Pair | Contract Address | Deviation | Heartbeat |
|------------|------------------|-----------|-----------|
| ETH/USD | `0xfEefF7c3fB57d18C5C6Cdd71e45D2D0b4F9377bF` | 0.5% | 24h |
| BTC/USD | `0x95Bc57e794aeb02E4a16eff406147f3ce2531F83` | 0.5% | 24h |
| USDT/USD | `0x07F05C2aFeb54b68Ea425CAbCcbF53E2d5605d76` | 0.3% | 24h |

### Price Validation Features
- ✅ **Positive Price Check**: Ensures prices > 0
- ✅ **Age Validation**: Rejects prices older than 24 hours
- ✅ **Deviation Protection**: 10% max deviation from last valid price
- ✅ **Circuit Breakers**: Uses last valid price if current fails validation
- ✅ **Fallback Mechanisms**: CoinGecko API backup if oracle fails

## 🔧 Smart Contracts

### Core Contracts
- **`PawnSystem.sol`**: Main pawn protocol contract
- **`ChainlinkPriceFeed.sol`**: Oracle wrapper with validation
- **`MockUSDT.sol`**: Test USDT token for development
- **`IPriceFeed.sol`**: Standardized oracle interface

### Key Functions
```solidity
// Create a new pawn position
function createPawn() external payable

// Redeem ETH collateral
function redeemPawn(uint256 positionId) external

// Check if position should be liquidated
function shouldLiquidate(uint256 positionId) public view returns (bool)

// Get current ETH price from oracle
function getETHPrice() public view returns (uint256)
```

## 🎯 Usage Examples

### Create a Pawn Position
```javascript
// Frontend API call
const result = await apiService.createPawn("0.1"); // 0.1 ETH
console.log(`Position created: ${result.positionId}`);
console.log(`Transaction: ${result.txHash}`);
```

### Get Current ETH Price
```javascript
// Get live price from Chainlink oracle
const price = await apiService.getETHPrice();
console.log(`Current ETH price: $${price} USD`);
```

### Redeem Position
```javascript
// Redeem with 10% interest
const repaymentAmount = (loanAmount * 1.1).toFixed(2);
const result = await apiService.redeemPawn(positionId, repaymentAmount);
console.log(`Redeemed: ${result.txHash}`);
```

## 📈 API Endpoints

### Pawn Operations
- `POST /api/pawn/create` - Create new pawn position
- `POST /api/pawn/redeem` - Redeem existing position
- `GET /api/pawn/position/:id` - Get position details
- `GET /api/pawn/price/eth` - Get current ETH price

### Oracle Information
- `GET /api/pawn/price/eth` - Live ETH price from Chainlink
- Oracle health monitoring and validation

## 🧪 Testing

### Test Oracle Integration
```bash
# Test oracle connection and price feeds
node test-oracle.js
```

### Check Contract Balances
```bash
# Check USDT liquidity and wallet balances
node check-balance.js
```

### Setup Liquidity
```bash
# Add USDT liquidity to the contract
node setup-liquidity.js
```

## ⚠️ Educational Purpose Disclaimer

**This project is created for educational and learning purposes only. It is NOT recommended for production use.**

### Why This is Educational Only:
- **Testnet Deployment**: Uses zkSync Sepolia testnet with test tokens
- **Mock Contracts**: Includes MockUSDT for demonstration purposes
- **Limited Security Audits**: Has not undergone comprehensive security audits
- **Simplified Implementation**: Focuses on core concepts rather than production robustness
- **No Real Value**: All transactions use testnet tokens with no real monetary value

### Learning Objectives:
- Understanding DeFi pawn protocol mechanics
- Working with Chainlink oracles and price feeds
- Smart contract development on zkSync Era
- Frontend integration with Web3 wallets
- Docker containerization for blockchain applications

## 🔒 Security Considerations

### What Would Be Needed for Production:
- Replace `MockUSDT` with real USDT contract
- Use mainnet Chainlink price feeds
- Implement multi-signature wallet for admin functions
- Add additional oracle sources for redundancy
- Set up monitoring and alerting systems
- Comprehensive security audits by professional firms
- Formal verification of smart contracts
- Insurance and risk management protocols

### Best Practices Demonstrated:
- Regular oracle health checks
- Price deviation monitoring
- Emergency pause functionality
- Environment variable management
- Proper error handling

## 🛠️ Development

### Local Development
```bash
# Install dependencies
npm install

# Compile contracts
cd contracts && npx hardhat compile

# Run tests
npm test

# Start development servers
npm run dev
```

### Docker Development
```bash
# Build and start all services
docker-compose up --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📋 Project Structure

```
bullpawn/
├── contracts/                 # Smart contracts
│   ├── contracts/            # Solidity source files
│   ├── scripts/              # Deployment scripts
│   └── artifacts-zk/         # Compiled contracts
├── backend/                  # Node.js backend
│   ├── src/                  # TypeScript source
│   └── dist/                 # Compiled JavaScript
├── frontend/                 # React frontend
│   ├── src/                  # React components
│   └── public/               # Static assets
├── scripts/                  # Utility scripts
├── docker-compose.yml        # Docker configuration
└── README.md                 # This file
```

## 🌐 Network Information

### zkSync Era Sepolia Testnet
- **Chain ID**: 300
- **RPC URL**: https://sepolia.era.zksync.dev
- **Explorer**: https://sepolia.explorer.zksync.io
- **Faucet**: https://sepoliafaucet.com/

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Chainlink** for providing decentralized oracle infrastructure
- **zkSync** for the Layer 2 scaling solution
- **OpenZeppelin** for secure smart contract libraries
- **Material-UI** for the beautiful React components

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/bullpawn/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/bullpawn/discussions)
- **Documentation**: [Wiki](https://github.com/yourusername/bullpawn/wiki)

---

## 🎓 Educational Value

This project demonstrates:
- **DeFi Protocol Design**: How pawn protocols work in decentralized finance
- **Oracle Integration**: Real-world Chainlink oracle implementation
- **Smart Contract Security**: Reentrancy protection, validation, and circuit breakers
- **Full-Stack Development**: React frontend, Node.js backend, and Solidity contracts
- **Docker Deployment**: Containerized blockchain application architecture
- **Web3 Integration**: MetaMask wallet connection and transaction handling

**⚠️ IMPORTANT DISCLAIMER**: This is an educational project deployed on testnet. It is NOT suitable for production use and should NOT be used with real funds. Always conduct thorough security audits before deploying any DeFi protocol to mainnet.

**🚀 Built with**: React, TypeScript, Solidity, zkSync Era, Chainlink Oracles, Docker