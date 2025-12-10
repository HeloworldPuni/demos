// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CartelShares is ERC1155, ERC1155Supply, Ownable {
    uint256 public constant SHARE_ID = 1;
    
    address public minter;

    constructor() ERC1155("https://api.basecartel.in/metadata/{id}.json") Ownable(msg.sender) {
        // Initial minting logic can go here or be controlled by CartelCore
    }

    modifier onlyMinter() {
        require(msg.sender == minter || msg.sender == owner(), "Not authorized to mint");
        _;
    }

    function setMinter(address _minter) external onlyOwner {
        minter = _minter;
    }

    function mint(address account, uint256 amount, bytes memory data) public onlyMinter {
        _mint(account, SHARE_ID, amount, data);
    }

    function burn(address account, uint256 amount) public onlyMinter {
        _burn(account, SHARE_ID, amount);
    }

    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    // Unordered override required by Solidity
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Supply)
    {
        super._update(from, to, ids, values);
    }
}
