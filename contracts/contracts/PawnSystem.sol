// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IPriceFeed.sol";

interface IERC20Extended is IERC20 {
    function decimals() external view returns (uint8);
}

contract PawnSystem is ReentrancyGuard, Pausable, Ownable {
    struct PawnPosition {
        address user;
        uint256 ethAmount;
        uint256 usdtAmount;
        uint256 timestamp;
        uint256 maturityDate;
        bool isActive;
        bool isLiquidated;
    }

    IERC20Extended public immutable usdtToken;
    IPriceFeed public immutable priceFeed;
    
    uint256 public constant LOAN_TO_VALUE_RATIO = 70; // 70%
    uint256 public constant INTEREST_RATE = 10; // 10%
    uint256 public constant LIQUIDATION_THRESHOLD = 70; // 70% of original value
    uint256 public constant LOAN_DURATION = 365 days; // 1 year
    
    // Price feed validation
    uint256 public constant PRICE_FEED_TIMEOUT = 3600; // 1 hour
    uint256 public constant MAX_PRICE_DEVIATION = 10; // 10% max deviation

    mapping(uint256 => PawnPosition) public pawnPositions;
    mapping(address => uint256[]) public userPositions;
    uint256 public nextPositionId = 1;

    event PawnCreated(
        uint256 indexed positionId,
        address indexed user,
        uint256 ethAmount,
        uint256 usdtAmount,
        uint256 maturityDate
    );

    event PawnRedeemed(
        uint256 indexed positionId,
        address indexed user,
        uint256 ethAmount,
        uint256 usdtAmount
    );

    event PawnLiquidated(
        uint256 indexed positionId,
        address indexed user,
        uint256 ethAmount,
        uint256 usdtAmount
    );

    constructor(address _usdtToken, address _priceFeed) {
        usdtToken = IERC20Extended(_usdtToken);
        priceFeed = IPriceFeed(_priceFeed);
    }

    function createPawn() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "ETH amount must be greater than 0");
        
        // Get current ETH price (simplified - in production, use Chainlink oracles)
        uint256 ethPrice = getETHPrice();
        // msg.value is in wei (18 decimals), ethPrice is in USDT units (6 decimals)
        // Result should be in USDT units (6 decimals)
        uint256 ethValueInUsdt = (msg.value * ethPrice) / 1e18;
        uint256 loanAmount = (ethValueInUsdt * LOAN_TO_VALUE_RATIO) / 100;

        // Check if contract has enough USDT
        require(
            usdtToken.balanceOf(address(this)) >= loanAmount,
            "Insufficient USDT liquidity"
        );

        // Create pawn position
        uint256 positionId = nextPositionId++;
        PawnPosition storage position = pawnPositions[positionId];
        
        position.user = msg.sender;
        position.ethAmount = msg.value;
        position.usdtAmount = loanAmount;
        position.timestamp = block.timestamp;
        position.maturityDate = block.timestamp + LOAN_DURATION;
        position.isActive = true;
        position.isLiquidated = false;

        userPositions[msg.sender].push(positionId);

        // Transfer USDT to user
        require(
            usdtToken.transfer(msg.sender, loanAmount),
            "USDT transfer failed"
        );

        emit PawnCreated(
            positionId,
            msg.sender,
            msg.value,
            loanAmount,
            position.maturityDate
        );
    }

    function redeemPawn(uint256 positionId) external nonReentrant whenNotPaused {
        PawnPosition storage position = pawnPositions[positionId];
        require(position.isActive, "Position not active");
        require(position.user == msg.sender, "Not position owner");
        require(!position.isLiquidated, "Position already liquidated");

        // Calculate repayment amount (principal + 10% interest)
        uint256 repaymentAmount = (position.usdtAmount * (100 + INTEREST_RATE)) / 100;

        // Check if user has enough USDT
        require(
            usdtToken.balanceOf(msg.sender) >= repaymentAmount,
            "Insufficient USDT balance"
        );

        // Check if position is not liquidated due to price drop
        require(!shouldLiquidate(positionId), "Position should be liquidated");

        // Transfer USDT from user to contract
        require(
            usdtToken.transferFrom(msg.sender, address(this), repaymentAmount),
            "USDT transfer failed"
        );

        // Mark position as inactive
        position.isActive = false;

        // Transfer ETH back to user
        (bool success, ) = payable(msg.sender).call{value: position.ethAmount}("");
        require(success, "ETH transfer failed");

        emit PawnRedeemed(
            positionId,
            msg.sender,
            position.ethAmount,
            repaymentAmount
        );
    }

    function liquidatePawn(uint256 positionId) external nonReentrant whenNotPaused {
        PawnPosition storage position = pawnPositions[positionId];
        require(position.isActive, "Position not active");
        require(!position.isLiquidated, "Position already liquidated");
        require(shouldLiquidate(positionId), "Position should not be liquidated");

        // Mark position as liquidated
        position.isActive = false;
        position.isLiquidated = true;

        emit PawnLiquidated(
            positionId,
            position.user,
            position.ethAmount,
            position.usdtAmount
        );
    }

    function shouldLiquidate(uint256 positionId) public view returns (bool) {
        PawnPosition memory position = pawnPositions[positionId];
        
        // Get current ETH price
        uint256 currentEthPrice = getETHPrice();
        uint256 currentEthValue = (position.ethAmount * currentEthPrice) / 1e18;
        uint256 liquidationThreshold = (position.usdtAmount * 100) / LOAN_TO_VALUE_RATIO;
        uint256 liquidationValue = (liquidationThreshold * LIQUIDATION_THRESHOLD) / 100;

        return currentEthValue <= liquidationValue;
    }

    function getETHPrice() public view returns (uint256) {
        // Use the ChainlinkPriceFeed wrapper which includes validation
        int256 price = priceFeed.getLatestPrice();
        
        // Additional validation
        require(price > 0, "Invalid price from oracle");
        
        // Convert price to USDT units (6 decimals)
        // Chainlink ETH/USD price feed returns price with 8 decimals
        // We need to convert to USDT units (6 decimals)
        return uint256(price) / 100; // Divide by 100 to convert from 8 to 6 decimals
    }

    function getUserPositions(address user) external view returns (uint256[] memory) {
        return userPositions[user];
    }

    function getPosition(uint256 positionId) external view returns (PawnPosition memory) {
        return pawnPositions[positionId];
    }

    // Oracle-related functions
    function getLatestPrice() external view returns (int256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return price;
    }
    
    function getPriceFeedInfo() external view returns (uint8 decimals, string memory description) {
        return (priceFeed.decimals(), priceFeed.description());
    }
    
    function isPriceFeedHealthy() external view returns (bool) {
        return priceFeed.isPriceFeedHealthy();
    }

    // Admin functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "ETH withdrawal failed");
    }

    function withdrawUSDT() external onlyOwner {
        uint256 balance = usdtToken.balanceOf(address(this));
        require(balance > 0, "No USDT to withdraw");
        require(usdtToken.transfer(owner(), balance), "USDT withdrawal failed");
    }

    // Receive ETH
    receive() external payable {}
}
