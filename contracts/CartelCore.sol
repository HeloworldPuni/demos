// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CartelShares.sol";
import "./CartelPot.sol";
import "./IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CartelCore is Ownable, ReentrancyGuard {
    CartelShares public sharesContract;
    CartelPot public pot;
    IERC20 public immutable usdc;
    
    uint256 public constant JOIN_SHARES = 100;
    
    uint256 public currentSeason = 1;
    mapping(address => mapping(uint256 => bool)) public seasonParticipation;
    
    // Referral system
    mapping(address => address) public referredBy;
    mapping(address => uint256) public referralCount;
    uint256 public constant REFERRAL_BONUS = 20;

    // Fees (USDC, 6 decimals)
    uint256 public JOIN_FEE = 0; // Free for Phase 1
    uint256 public RAID_FEE = 5000;  // 0.005 USDC

    // Invite System
    bool public inviteOnly = true;
    uint256 public constant INITIAL_INVITES = 3;
    mapping(address => uint256) public invites;

    // Auto-Agent
    mapping(address => bool) public authorizedAgents;

    // Daily Revenue Pool (Fee-Based Profit Share)
    uint256 public dailyRevenuePool;
    uint256 public lastDistributionTime;
    uint256 public constant DISTRIBUTION_INTERVAL = 24 hours;

    // Claim-based distribution (gas efficient)
    uint256 public cumulativeRewardPerShare; // scaled by 1e18
    mapping(address => uint256) public lastClaimedRewardPerShare;
    mapping(address => uint256) public pendingRewards;

    event Join(address indexed player, address indexed referrer, uint256 shares, uint256 fee);
    event Raid(address indexed raider, address indexed target, uint256 amountStolen, bool success, uint256 fee);
    event Betrayal(address indexed traitor, uint256 amountStolen);
    event InvitesGranted(address indexed user, uint256 amount);
    event RevenueAdded(uint256 amount, string source);
    event ProfitDistributed(uint256 totalAmount, uint256 rewardPerShare);
    event ProfitClaimed(address indexed user, uint256 amount);

    constructor(address _shares, address _pot, address _usdc) Ownable(msg.sender) {
        sharesContract = CartelShares(_shares);
        pot = CartelPot(_pot);
        usdc = IERC20(_usdc);
        
        // Owner gets infinite invites
        invites[msg.sender] = type(uint256).max;
        lastDistributionTime = block.timestamp;
    }

    modifier onlyAgent() {
        require(authorizedAgents[msg.sender], "Not authorized agent");
        _;
    }

    function setAgent(address agent, bool status) external onlyOwner {
        authorizedAgents[agent] = status;
    }

    function setFees(uint256 _joinFee, uint256 _raidFee) external onlyOwner {
        JOIN_FEE = _joinFee;
        RAID_FEE = _raidFee;
    }

    // Invite System Admin
    function setInviteOnly(bool _enabled) external onlyOwner {
        inviteOnly = _enabled;
    }

    function grantInvites(address user, uint256 amount) external onlyOwner {
        invites[user] += amount;
        emit InvitesGranted(user, amount);
    }

    function join(address referrer) external nonReentrant {
        require(sharesContract.balanceOf(msg.sender, 1) == 0, "Already joined");

        // Invite Logic
        if (inviteOnly) {
            require(referrer != address(0), "Referrer required in invite-only mode");
            require(invites[referrer] > 0, "Referrer has no invites left");
            
            // Decrement referrer's invites
            invites[referrer]--;
            
            // Grant invites to new user
            invites[msg.sender] = INITIAL_INVITES;
        }

        // Fee Logic
        if (JOIN_FEE > 0) {
            pot.depositFrom(msg.sender, JOIN_FEE);
            dailyRevenuePool += JOIN_FEE;
            emit RevenueAdded(JOIN_FEE, "join");
        }
        
        // Mint initial shares to the user
        sharesContract.mint(msg.sender, JOIN_SHARES, "");
        
        // Track referral if valid
        if (referrer != address(0) && referrer != msg.sender) {
            referredBy[msg.sender] = referrer;
            referralCount[referrer]++;
            
            // Give bonus to referrer
            sharesContract.mint(referrer, REFERRAL_BONUS, "");
        }
        
        emit Join(msg.sender, referrer, JOIN_SHARES, JOIN_FEE);
    }

    function getReferralCount(address user) external view returns (uint256) {
        return referralCount[user];
    }

    // Daily Profit Distribution
    function distributeDailyProfits() external {
        require(block.timestamp >= lastDistributionTime + DISTRIBUTION_INTERVAL, "Too soon");
        require(dailyRevenuePool > 0, "No revenue to distribute");
        
        uint256 totalShares = sharesContract.totalSupply(1);
        require(totalShares > 0, "No shares exist");
        
        // Calculate reward per share (scaled by 1e18 for precision)
        uint256 rewardPerShare = (dailyRevenuePool * 1e18) / totalShares;
        cumulativeRewardPerShare += rewardPerShare;
        
        emit ProfitDistributed(dailyRevenuePool, rewardPerShare);
        
        dailyRevenuePool = 0;
        lastDistributionTime = block.timestamp;
    }

    function claimProfit() external nonReentrant {
        _updatePendingRewards(msg.sender);
        
        uint256 amount = pendingRewards[msg.sender];
        require(amount > 0, "No profits to claim");
        
        pendingRewards[msg.sender] = 0;
        pot.withdraw(msg.sender, amount);
        
        emit ProfitClaimed(msg.sender, amount);
    }

    function claimProfitFor(address user) external nonReentrant onlyAgent {
        _updatePendingRewards(user);
        
        uint256 amount = pendingRewards[user];
        require(amount > 0, "No profits to claim");
        
        pendingRewards[user] = 0;
        pot.withdraw(user, amount);
        
        emit ProfitClaimed(user, amount);
    }

    function _updatePendingRewards(address user) internal {
        uint256 userShares = sharesContract.balanceOf(user, 1);
        if (userShares == 0) return;
        
        uint256 rewardDelta = cumulativeRewardPerShare - lastClaimedRewardPerShare[user];
        uint256 newRewards = (userShares * rewardDelta) / 1e18;
        
        pendingRewards[user] += newRewards;
        lastClaimedRewardPerShare[user] = cumulativeRewardPerShare;
    }

    function getPendingProfit(address user) external view returns (uint256) {
        uint256 userShares = sharesContract.balanceOf(user, 1);
        if (userShares == 0) return pendingRewards[user];
        
        uint256 rewardDelta = cumulativeRewardPerShare - lastClaimedRewardPerShare[user];
        uint256 newRewards = (userShares * rewardDelta) / 1e18;
        
        return pendingRewards[user] + newRewards;
    }

    // Admin sponsor function
    function sponsorRevenue(uint256 amount) external {
        usdc.transferFrom(msg.sender, address(pot), amount);
        dailyRevenuePool += amount;
        emit RevenueAdded(amount, "sponsor");
    }

    function raid(address target) external nonReentrant {
        _raid(msg.sender, target);
    }

    function raidFor(address user, address target) external nonReentrant onlyAgent {
        _raid(user, target);
    }

    function _raid(address raider, address target) internal {
        // Collect raid fee
        pot.depositFrom(msg.sender, RAID_FEE);
        dailyRevenuePool += RAID_FEE;
        emit RevenueAdded(RAID_FEE, "raid");
        
        // Steal shares logic (placeholder)
        bool success = true;
        uint256 stolen = 0;
        
        emit Raid(raider, target, stolen, success, RAID_FEE);
    }

    function betray() external nonReentrant {
        // 1. Burn all shares
        // 2. Calculate payout (e.g. 50% of pot / total shares * user shares)
        // 3. Transfer payout
        // 4. Emit event
        emit Betrayal(msg.sender, 0);
    }
}
