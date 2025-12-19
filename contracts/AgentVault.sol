// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IERC20.sol";

interface ICartelCore {
    function raidFor(address user, address target) external;
    function highStakesRaidFor(address user, address target) external;
    function claimYieldFor(address user) external;
    function RAID_FEE() external view returns (uint256);
    function HIGH_STAKES_RAID_FEE() external view returns (uint256);
}

contract AgentVault is EIP712, Ownable {
    IERC20 public immutable usdc;
    ICartelCore public cartelCore;

    // User balances in the vault
    mapping(address => uint256) public balances;

    // Replay protection for signatures
    mapping(address => uint256) public nonces;

    // Typehash for delegation
    // ExecuteAction(address user,string action,bytes data,uint256 nonce,uint256 deadline)
    bytes32 private constant ACTION_TYPEHASH = keccak256("ExecuteAction(address user,string action,bytes data,uint256 nonce,uint256 deadline)");

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event ActionExecuted(address indexed user, string action, uint256 fee);

    constructor(address _usdc, address _cartelCore, address _cartelPot) EIP712("BaseCartelAgent", "1") Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        cartelCore = ICartelCore(_cartelCore);
        
        // Approve CartelCore and CartelPot to spend unlimited USDC
        // Core for potential future features, Pot for current fee collection
        usdc.approve(_cartelCore, type(uint256).max);
        usdc.approve(_cartelPot, type(uint256).max);
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        balances[msg.sender] += amount;
        emit Deposit(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient funds");
        balances[msg.sender] -= amount;
        require(usdc.transfer(msg.sender, amount), "Transfer failed");
        emit Withdraw(msg.sender, amount);
    }

    // Execute action on behalf of user
    struct ActionParams {
        address user;
        string action;
        bytes data;
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    // Execute action on behalf of user
    function executeAction(ActionParams calldata params) external {
        // 1. Verify Signature
        require(block.timestamp <= params.deadline, "Signature expired");
        
        bytes32 structHash = keccak256(abi.encode(
            ACTION_TYPEHASH,
            params.user,
            keccak256(bytes(params.action)),
            keccak256(params.data),
            nonces[params.user]++,
            params.deadline
        ));
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, params.v, params.r, params.s);
        require(signer == params.user, "Invalid signature");

        // 2. Execute Action
        if (keccak256(bytes(params.action)) == keccak256(bytes("raid"))) {
            address target = abi.decode(params.data, (address));
            
            // Get fee dynamically from CartelCore
            uint256 fee = cartelCore.RAID_FEE();
            
            require(balances[params.user] >= fee, "Insufficient user balance for raid fee");
            balances[params.user] -= fee;
            
            cartelCore.raidFor(params.user, target);
            emit ActionExecuted(params.user, "raid", fee);
        } 
        else if (keccak256(bytes(params.action)) == keccak256(bytes("highStakesRaid"))) {
            address target = abi.decode(params.data, (address));
            
            // Get fee dynamically
            uint256 fee = cartelCore.HIGH_STAKES_RAID_FEE();
            
            require(balances[params.user] >= fee, "Insufficient user balance for high stakes raid fee");
            balances[params.user] -= fee;
            
            cartelCore.highStakesRaidFor(params.user, target);
            emit ActionExecuted(params.user, "highStakesRaid", fee);
        }
        else if (keccak256(bytes(params.action)) == keccak256(bytes("claim"))) {
             cartelCore.claimYieldFor(params.user);
             emit ActionExecuted(params.user, "claim", 0);
        }
        else {
            revert("Unknown action");
        }
    }
}
