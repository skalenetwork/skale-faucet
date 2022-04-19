import "@openzeppelin/contracts/access/Ownable.sol";
pragma solidity ^0.8.0;

interface IEtherbase {
    function partiallyRetrieve(address payable receiver, uint amount) external;
}

contract Faucet is Ownable {
    address constant etherbaseAddress = 0xd2bA3e0000000000000000000000000000000000;
    uint public retrievedAmount;

    constructor(uint _retrievedAmount) public {
        retrievedAmount = _retrievedAmount;
    }

    function setRetrievedAmount(uint _retrievedAmount) onlyOwner external {
        retrievedAmount = _retrievedAmount;
    }

    function retrieve() external {
        require(msg.sender.balance < retrievedAmount, "Invalid receiver balance");
        uint amount = retrievedAmount - msg.sender.balance;
        IEtherbase(etherbaseAddress).partiallyRetrieve(payable(msg.sender), amount);
    }
}
