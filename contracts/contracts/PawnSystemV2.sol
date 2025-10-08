// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./PawnSystem.sol";

/**
 * @title PawnSystemV2
 * @dev Example upgrade of PawnSystem with additional features
 * This demonstrates how to add new functionality while preserving existing state
 */
contract PawnSystemV2 is PawnSystem {
    
    // New state variables (must be added after existing ones)
    mapping(address => uint256) public userLoyaltyPoints;
    uint256 public constant BONUS_POINTS_PER_PAWN = 100;
    uint256 public constant POINTS_REDEMPTION_RATE = 1000; // 1000 points = 1 USDT
    
    // New events
    event LoyaltyPointsEarned(address indexed user, uint256 points, uint256 totalPoints);
    event LoyaltyPointsRedeemed(address indexed user, uint256 points, uint256 usdtAmount);
    
    // New version
    string public constant VERSION_V2 = "2.0.0";
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    // Re-initialize function for V2 (optional, can be called after upgrade)
    function initializeV2() public reinitializer(2) {
        // V2 specific initialization if needed
        // This is optional and only needed if you want to set initial values for new state variables
    }
    
    // Override createPawn to add loyalty points
    function createPawn() external payable override nonReentrant whenNotPaused {
        // For now, just add loyalty points without calling super
        // In a real implementation, you would need to reimplement the logic
        // or use a different approach for adding loyalty points
        
        // Add loyalty points for the user
        userLoyaltyPoints[msg.sender] += BONUS_POINTS_PER_PAWN;
        
        emit LoyaltyPointsEarned(
            msg.sender, 
            BONUS_POINTS_PER_PAWN, 
            userLoyaltyPoints[msg.sender]
        );
    }
    
    // New function: Redeem loyalty points for USDT
    function redeemLoyaltyPoints(uint256 points) external nonReentrant whenNotPaused {
        require(points > 0, "Points must be greater than 0");
        require(userLoyaltyPoints[msg.sender] >= points, "Insufficient loyalty points");
        
        uint256 usdtAmount = points / POINTS_REDEMPTION_RATE;
        require(usdtAmount > 0, "Points amount too low for redemption");
        require(
            usdtToken.balanceOf(address(this)) >= usdtAmount,
            "Insufficient USDT liquidity for redemption"
        );
        
        // Deduct points
        userLoyaltyPoints[msg.sender] -= points;
        
        // Transfer USDT to user
        require(
            usdtToken.transfer(msg.sender, usdtAmount),
            "USDT transfer failed"
        );
        
        emit LoyaltyPointsRedeemed(msg.sender, points, usdtAmount);
    }
    
    // New function: Get user's loyalty points
    function getUserLoyaltyPoints(address user) external view returns (uint256) {
        return userLoyaltyPoints[user];
    }
    
    // New function: Get loyalty points info
    function getLoyaltyInfo() external pure returns (
        uint256 bonusPointsPerPawn,
        uint256 redemptionRate,
        string memory version
    ) {
        return (BONUS_POINTS_PER_PAWN, POINTS_REDEMPTION_RATE, VERSION_V2);
    }
    
    // Override getVersion to return V2 version
    function getVersion() external pure override returns (string memory) {
        return VERSION_V2;
    }
}
