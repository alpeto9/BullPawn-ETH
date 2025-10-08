// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IPriceFeed.sol";

interface IERC20Extended is IERC20 {
    function decimals() external view returns (uint8);
}

/**
 * @title PawnSystemProduction
 * @dev Production-ready pawn protocol with enhanced security features
 * @notice This contract implements a secure pawn protocol with multiple safety mechanisms
 */
contract PawnSystemProduction is 
    Initializable,
    ReentrancyGuardUpgradeable, 
    PausableUpgradeable, 
    AccessControlUpgradeable,
    UUPSUpgradeable 
{
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant LIQUIDATOR_ROLE = keccak256("LIQUIDATOR_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    struct PawnPosition {
        address user;
        uint256 ethAmount;
        uint256 usdtAmount;
        uint256 timestamp;
        uint256 maturityDate;
        bool isActive;
        bool isLiquidated;
        uint256 liquidationPrice; // Price at which position was created
    }

    struct OracleConfig {
        IPriceFeed priceFeed;
        bool isActive;
        uint256 weight; // Weight for weighted average (1-100)
    }

    struct SystemConfig {
        uint256 loanToValueRatio; // Basis points (7000 = 70%)
        uint256 interestRate; // Basis points (1000 = 10%)
        uint256 liquidationThreshold; // Basis points (7000 = 70%)
        uint256 liquidationBonus; // Basis points (500 = 5%)
        uint256 loanDuration; // Seconds
        uint256 minLoanAmount; // Minimum loan amount in USDT
        uint256 maxLoanAmount; // Maximum loan amount in USDT
        uint256 reserveRatio; // Minimum reserve ratio (1000 = 10%)
    }

    IERC20Extended public usdtToken;
    OracleConfig[] public oracles;
    
    SystemConfig public config;
    
    // Emergency controls
    bool public emergencyMode;
    bool public liquidationPaused;
    uint256 public emergencyPauseTime;
    
    // Position management
    mapping(uint256 => PawnPosition) public pawnPositions;
    mapping(address => uint256[]) public userPositions;
    uint256 public nextPositionId = 1;
    
    // Liquidation tracking
    mapping(address => uint256) public liquidatorRewards;
    uint256 public totalLiquidated;
    
    // Reserve management
    uint256 public totalReserves;
    uint256 public totalDebt;
    
    // Version tracking
    string public constant VERSION = "1.0.0";
    uint256 public upgradeCount;

    // Events
    event PawnCreated(
        uint256 indexed positionId,
        address indexed user,
        uint256 ethAmount,
        uint256 usdtAmount,
        uint256 maturityDate,
        uint256 liquidationPrice
    );

    event PawnRedeemed(
        uint256 indexed positionId,
        address indexed user,
        uint256 ethAmount,
        uint256 usdtAmount,
        uint256 interestPaid
    );

    event PawnLiquidated(
        uint256 indexed positionId,
        address indexed user,
        address indexed liquidator,
        uint256 ethAmount,
        uint256 usdtAmount,
        uint256 liquidatorReward
    );

    event EmergencyModeToggled(bool emergencyMode, uint256 timestamp);
    event LiquidationPaused(bool paused, uint256 timestamp);
    event OracleAdded(address indexed oracle, uint256 weight);
    event OracleRemoved(address indexed oracle);
    event ConfigUpdated(SystemConfig newConfig);
    event LiquidatorRewardClaimed(address indexed liquidator, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _usdtToken,
        address _admin,
        SystemConfig memory _initialConfig
    ) public initializer {
        __ReentrancyGuard_init();
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();
        
        usdtToken = IERC20Extended(_usdtToken);
        config = _initialConfig;
        
        // Set up roles
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(EMERGENCY_ROLE, _admin);
        
        // Initialize emergency controls
        emergencyMode = false;
        liquidationPaused = false;
        emergencyPauseTime = 0;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(ADMIN_ROLE) {}

    // ============ ORACLE MANAGEMENT ============

    function addOracle(address _oracle, uint256 _weight) external onlyRole(ADMIN_ROLE) {
        require(_oracle != address(0), "Invalid oracle address");
        require(_weight > 0 && _weight <= 100, "Invalid weight");
        
        oracles.push(OracleConfig({
            priceFeed: IPriceFeed(_oracle),
            isActive: true,
            weight: _weight
        }));
        
        emit OracleAdded(_oracle, _weight);
    }

    function removeOracle(uint256 _index) external onlyRole(ADMIN_ROLE) {
        require(_index < oracles.length, "Invalid oracle index");
        
        emit OracleRemoved(address(oracles[_index].priceFeed));
        
        // Move last oracle to this position
        oracles[_index] = oracles[oracles.length - 1];
        oracles.pop();
    }

    function setOracleActive(uint256 _index, bool _active) external onlyRole(ADMIN_ROLE) {
        require(_index < oracles.length, "Invalid oracle index");
        oracles[_index].isActive = _active;
    }

    // ============ CONFIGURATION MANAGEMENT ============

    function updateConfig(SystemConfig memory _newConfig) external onlyRole(ADMIN_ROLE) {
        require(_newConfig.loanToValueRatio <= 9000, "LTV too high"); // Max 90%
        require(_newConfig.interestRate <= 5000, "Interest rate too high"); // Max 50%
        require(_newConfig.liquidationThreshold <= 9000, "Liquidation threshold too high");
        require(_newConfig.liquidationBonus <= 1000, "Liquidation bonus too high"); // Max 10%
        require(_newConfig.minLoanAmount > 0, "Invalid min loan amount");
        require(_newConfig.maxLoanAmount > _newConfig.minLoanAmount, "Invalid max loan amount");
        require(_newConfig.reserveRatio <= 5000, "Reserve ratio too high"); // Max 50%
        
        config = _newConfig;
        emit ConfigUpdated(_newConfig);
    }

    // ============ EMERGENCY CONTROLS ============

    function toggleEmergencyMode() external onlyRole(EMERGENCY_ROLE) {
        emergencyMode = !emergencyMode;
        emergencyPauseTime = block.timestamp;
        emit EmergencyModeToggled(emergencyMode, block.timestamp);
    }

    function pauseLiquidations() external onlyRole(EMERGENCY_ROLE) {
        liquidationPaused = true;
        emit LiquidationPaused(true, block.timestamp);
    }

    function unpauseLiquidations() external onlyRole(ADMIN_ROLE) {
        liquidationPaused = false;
        emit LiquidationPaused(false, block.timestamp);
    }

    // ============ LIQUIDATOR MANAGEMENT ============

    function addLiquidator(address _liquidator) external onlyRole(ADMIN_ROLE) {
        _grantRole(LIQUIDATOR_ROLE, _liquidator);
    }

    function removeLiquidator(address _liquidator) external onlyRole(ADMIN_ROLE) {
        _revokeRole(LIQUIDATOR_ROLE, _liquidator);
    }

    function claimLiquidatorReward() external nonReentrant {
        uint256 reward = liquidatorRewards[msg.sender];
        require(reward > 0, "No rewards to claim");
        
        liquidatorRewards[msg.sender] = 0;
        require(usdtToken.transfer(msg.sender, reward), "Transfer failed");
        
        emit LiquidatorRewardClaimed(msg.sender, reward);
    }

    // ============ CORE PAWN FUNCTIONS ============

    function createPawn() external payable nonReentrant whenNotPaused {
        require(!emergencyMode, "Emergency mode active");
        require(msg.value > 0, "ETH amount must be greater than 0");
        require(oracles.length > 0, "No oracles configured");
        
        // Get validated ETH price
        uint256 ethPrice = getValidatedETHPrice();
        uint256 ethValueInUsdt = (msg.value * ethPrice) / 1e18;
        uint256 loanAmount = (ethValueInUsdt * config.loanToValueRatio) / 10000;
        
        // Validate loan amount
        require(loanAmount >= config.minLoanAmount, "Loan amount too small");
        require(loanAmount <= config.maxLoanAmount, "Loan amount too large");
        
        // Check reserves
        require(
            usdtToken.balanceOf(address(this)) >= loanAmount + getRequiredReserves(),
            "Insufficient USDT liquidity"
        );

        // Create pawn position
        uint256 positionId = nextPositionId++;
        PawnPosition storage position = pawnPositions[positionId];
        
        position.user = msg.sender;
        position.ethAmount = msg.value;
        position.usdtAmount = loanAmount;
        position.timestamp = block.timestamp;
        position.maturityDate = block.timestamp + config.loanDuration;
        position.isActive = true;
        position.isLiquidated = false;
        position.liquidationPrice = ethPrice;

        userPositions[msg.sender].push(positionId);
        
        // Update system state
        totalDebt += loanAmount;
        totalReserves += msg.value;

        // Transfer USDT to user
        require(usdtToken.transfer(msg.sender, loanAmount), "USDT transfer failed");

        emit PawnCreated(
            positionId,
            msg.sender,
            msg.value,
            loanAmount,
            position.maturityDate,
            ethPrice
        );
    }

    function redeemPawn(uint256 positionId) external nonReentrant whenNotPaused {
        PawnPosition storage position = pawnPositions[positionId];
        require(position.isActive, "Position not active");
        require(position.user == msg.sender, "Not position owner");
        require(!position.isLiquidated, "Position already liquidated");
        require(!shouldLiquidate(positionId), "Position should be liquidated");

        // Calculate repayment amount with interest
        uint256 interestAmount = (position.usdtAmount * config.interestRate) / 10000;
        uint256 repaymentAmount = position.usdtAmount + interestAmount;

        // Check if user has enough USDT
        require(
            usdtToken.balanceOf(msg.sender) >= repaymentAmount,
            "Insufficient USDT balance"
        );

        // Transfer USDT from user to contract
        require(
            usdtToken.transferFrom(msg.sender, address(this), repaymentAmount),
            "USDT transfer failed"
        );

        // Update system state
        totalDebt -= position.usdtAmount;
        totalReserves -= position.ethAmount;
        position.isActive = false;

        // Transfer ETH back to user
        (bool success, ) = payable(msg.sender).call{value: position.ethAmount}("");
        require(success, "ETH transfer failed");

        emit PawnRedeemed(
            positionId,
            msg.sender,
            position.ethAmount,
            repaymentAmount,
            interestAmount
        );
    }

    function liquidatePawn(uint256 positionId) external nonReentrant whenNotPaused {
        require(hasRole(LIQUIDATOR_ROLE, msg.sender), "Not authorized liquidator");
        require(!liquidationPaused, "Liquidations paused");
        require(!emergencyMode, "Emergency mode active");
        
        PawnPosition storage position = pawnPositions[positionId];
        require(position.isActive, "Position not active");
        require(!position.isLiquidated, "Position already liquidated");
        require(shouldLiquidate(positionId), "Position should not be liquidated");

        // Calculate liquidator reward
        uint256 liquidatorReward = (position.usdtAmount * config.liquidationBonus) / 10000;
        
        // Update system state
        totalDebt -= position.usdtAmount;
        totalReserves -= position.ethAmount;
        position.isActive = false;
        position.isLiquidated = true;
        
        // Update liquidator rewards
        liquidatorRewards[msg.sender] += liquidatorReward;
        totalLiquidated += position.usdtAmount;

        emit PawnLiquidated(
            positionId,
            position.user,
            msg.sender,
            position.ethAmount,
            position.usdtAmount,
            liquidatorReward
        );
    }

    // ============ VIEW FUNCTIONS ============

    function shouldLiquidate(uint256 positionId) public view returns (bool) {
        PawnPosition memory position = pawnPositions[positionId];
        if (!position.isActive || position.isLiquidated) return false;
        
        uint256 currentEthPrice = getValidatedETHPrice();
        uint256 currentEthValue = (position.ethAmount * currentEthPrice) / 1e18;
        uint256 liquidationThreshold = (position.usdtAmount * 10000) / config.loanToValueRatio;
        uint256 liquidationValue = (liquidationThreshold * config.liquidationThreshold) / 10000;

        return currentEthValue <= liquidationValue;
    }

    function getValidatedETHPrice() public view returns (uint256) {
        require(oracles.length > 0, "No oracles configured");
        
        uint256 totalWeight = 0;
        uint256 weightedPriceSum = 0;
        
        for (uint256 i = 0; i < oracles.length; i++) {
            if (oracles[i].isActive) {
                try oracles[i].priceFeed.getLatestPrice() returns (int256 price) {
                    if (price > 0) {
                        weightedPriceSum += uint256(price) * oracles[i].weight;
                        totalWeight += oracles[i].weight;
                    }
                } catch {
                    // Skip failed oracle
                    continue;
                }
            }
        }
        
        require(totalWeight > 0, "No valid oracles");
        
        // Convert from 8 decimals to 6 decimals (USDT)
        return (weightedPriceSum / totalWeight) / 100;
    }

    function getRequiredReserves() public view returns (uint256) {
        return (totalDebt * config.reserveRatio) / 10000;
    }

    function getSystemHealth() external view returns (
        uint256 totalReservesETH,
        uint256 totalDebtUSDT,
        uint256 requiredReserves,
        uint256 availableReserves,
        bool isHealthy
    ) {
        totalReservesETH = totalReserves;
        totalDebtUSDT = totalDebt;
        requiredReserves = getRequiredReserves();
        availableReserves = usdtToken.balanceOf(address(this));
        isHealthy = availableReserves >= requiredReserves;
    }

    function getUserPositions(address user) external view returns (uint256[] memory) {
        return userPositions[user];
    }

    function getPosition(uint256 positionId) external view returns (PawnPosition memory) {
        return pawnPositions[positionId];
    }

    function getTotalPawns() external view returns (uint256) {
        return nextPositionId - 1;
    }

    function getVersion() external pure returns (string memory) {
        return VERSION;
    }

    function getUpgradeCount() external view returns (uint256) {
        return upgradeCount;
    }

    // ============ ADMIN FUNCTIONS ============

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function withdrawETH(uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(amount <= address(this).balance, "Insufficient ETH balance");
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "ETH withdrawal failed");
    }

    function withdrawUSDT(uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(amount <= usdtToken.balanceOf(address(this)), "Insufficient USDT balance");
        require(usdtToken.transfer(msg.sender, amount), "USDT withdrawal failed");
    }

    // ============ UPGRADE FUNCTIONS ============

    function upgradeTo(address newImplementation) external override onlyRole(ADMIN_ROLE) {
        address oldImplementation = _getImplementation();
        upgradeCount++;
        _upgradeToAndCall(newImplementation, "", false);
        emit ContractUpgraded(oldImplementation, newImplementation, upgradeCount);
    }

    function getImplementation() external view returns (address) {
        return _getImplementation();
    }

    // ============ EVENTS ============

    event ContractUpgraded(
        address indexed oldImplementation,
        address indexed newImplementation,
        uint256 upgradeCount
    );

    // Receive ETH
    receive() external payable {}
}
