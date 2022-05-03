/**
 * @license
 * SKALE Faucet
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * @file index.js
 * @copyright SKALE Labs 2022-Present
 */

const BN = require("bn.js");
const crypto = require("crypto");
const Web3 = require('web3');
const faucetMeta = require('../assets/faucet.json');
const etherbaseMeta = require('../assets/etherbase.json');
const { keccak256 } = require("@ethersproject/keccak256");

class SkaleFaucet {

    /**
     * Initialization of SkaleFaucet API client
     *
     * @class
     *
     * @param {string|object} web3Provider - A URL of SKALE endpoint or one of the Web3 provider classes
     * @param {string} faucetAddress - SkaleFaucet contract address
     */
    constructor(web3Provider, faucetAddress='', difficulty=1) {
        this.web3 = new Web3(web3Provider);
//        this.contract = new this.web3.eth.Contract(faucetMeta.abi, faucetAddress);
        this.difficulty = new BN(difficulty);
    }

    async initialize(retrievedAmount, totalAmount, ownerKey) {
        let faucetContract = new this.web3.eth.Contract(faucetMeta.abi);
        let deployTx = faucetContract.deploy({
            data: faucetMeta.bin,
            arguments: [retrievedAmount, totalAmount]
        });

        let account = this.web3.eth.accounts.privateKeyToAccount(ownerKey).address;
        let tx = {
            from: account,
            data: deployTx.encodeABI(),
            nonce: await this.web3.eth.getTransactionCount(account),
            chainId: await this.web3.eth.net.getId(),
            gas: await deployTx.estimateGas()
        };
        let signedTx = await this.web3.eth.accounts.signTransaction(tx, ownerKey);
        let receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        faucetContract.options.address = receipt.contractAddress;

        let etherbaseContract = new this.web3.eth.Contract(etherbaseMeta.abi, etherbaseMeta.address);
        let role = await etherbaseContract.methods.ETHER_MANAGER_ROLE().call();
        let txData = etherbaseContract.methods.grantRole(role, faucetContract.options.address);
        tx = {
            from: account,
            to: etherbaseMeta.address,
            data: txData.encodeABI(),
            nonce: await this.web3.eth.getTransactionCount(account),
            chainId: await this.web3.eth.net.getId(),
            gas: await txData.estimateGas()
        };
        signedTx = await this.web3.eth.accounts.signTransaction(tx, ownerKey);
        receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        this.contract = faucetContract;
        return faucetContract.address;
    }

    async retrieve(privateKey) {
        let data = this.contract.methods.retrieve().encodeABI();
        let account = this.web3.eth.accounts.privateKeyToAccount(privateKey).address;
        let nonce = await this.web3.eth.getTransactionCount(account);
        let chainId = await this.web3.eth.net.getId();
        let tx = {
            from: account,
            data: data,
            to: this.contract.address,
            nonce: nonce,
            chainId: chainId
        };
        let gas = await this.contract.methods.retrieve().estimateGas(tx);
        tx.gas = gas;
        await this._mineFreeGas(tx);
        let signedTx = await this.web3.eth.accounts.signTransaction(tx, privateKey);
        return await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    }

    async retrievedAmount() {
        return await this.contract.methods.retrievedAmount().call();
    }

    async _mineFreeGas(tx) {
        let nonce = this.web3.utils.hexToNumber(tx.nonce);
        let nonceHash = new BN(this.web3.utils.soliditySha3(nonce).slice(2), 16)
        let addressHash = new BN(this.web3.utils.soliditySha3(tx.from).slice(2), 16)
        let nonceAddressXOR = nonceHash.xor(addressHash)
        let maxNumber = new BN(2).pow(new BN(256)).sub(new BN(1));
        let divConstant = maxNumber.div(this.difficulty);
        let candidate;
        while (true){
            candidate = crypto.randomBytes(32);
            let candidateHash = new BN(keccak256(candidate).slice(2), 16);
            let resultHash = nonceAddressXOR.xor(candidateHash);
            let externalGas = divConstant.div(resultHash).toNumber();
            if (externalGas >= tx.gas) {
                break;
            }
        }
        tx.gasPrice = "0x" + candidate.toString('hex');
    }
}

module.exports = SkaleFaucet;
