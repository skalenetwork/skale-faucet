import "@openzeppelin/contracts/access/Ownable.sol";
pragma solidity ^0.8.0;

interface IEtherbase {
    function partiallyRetrieve(address payable receiver, uint amount) external;
}

contract Faucet is Ownable {
    address constant etherbaseAddress = 0xd2bA3e0000000000000000000000000000000000;
    uint public constant timeDelta = 86400;
    uint public retrievedAmount;
    uint public totalFuelAmount;
    mapping (address => uint) public lastRetrieve;

    constructor(uint _retrievedAmount, uint _totalFuelAmount) public {
        retrievedAmount = _retrievedAmount;
        totalFuelAmount = _totalFuelAmount;
    }

    function setRetrievedAmount(uint _retrievedAmount) onlyOwner external {
        retrievedAmount = _retrievedAmount;
    }

    function refillFaucet(uint _fuelAmount) onlyOwner external {
        totalFuelAmount = _fuelAmount;
    }

    function retrieve() external {
        require(msg.sender.balance < retrievedAmount, "Invalid receiver balance");
        require(lastRetrieve[msg.sender] + timeDelta < block.timestamp, "Retrieve could be called once per day");
        require(retrievedAmount < totalFuelAmount, "Not enough sFuel in Faucet");
        uint amount = retrievedAmount - msg.sender.balance;
        IEtherbase(etherbaseAddress).partiallyRetrieve(payable(msg.sender), amount);
        totalFuelAmount -= retrievedAmount;
        lastRetrieve[msg.sender] = block.timestamp;
    }
}
