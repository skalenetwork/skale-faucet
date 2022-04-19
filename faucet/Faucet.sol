import "@openzeppelin/contracts/access/Ownable.sol";
pragma solidity ^0.8.0;

interface IEtherbase {
    function partiallyRetrieve(address payable receiver, uint amount) external;
}

contract Faucet is Ownable {
    uint public RetrievedAmount;

    constructor(uint _retrievedAmount) public {
        RetrievedAmount = _retrievedAmount;
    }

    function setRetrievedAmount(uint _retrievedAmount) onlyOwner external {
        RetrievedAmount = _retrievedAmount;
    }

    function retrieve(address payable receiver) external {
    }
}
