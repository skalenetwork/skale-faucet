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
        this.difficulty = new BN(difficulty);
        if (faucetAddress !== '') {
            this.contract = new this.web3.eth.Contract(faucetMeta.abi, faucetAddress);
        }
    }

    async initialize(retrievedAmount, totalAmount, ownerKey) {
        let faucetContract = new this.web3.eth.Contract(faucetMeta.abi);
        let deployContract = faucetContract.deploy({
            data: faucetMeta.bin,
            arguments: [retrievedAmount, totalAmount]
        });
        let receipt = await this._signAndSend(ownerKey, {method: deployContract});
        faucetContract.options.address = receipt.contractAddress;

        let etherbaseContract = new this.web3.eth.Contract(etherbaseMeta.abi, etherbaseMeta.address);
        let role = await etherbaseContract.methods.ETHER_MANAGER_ROLE().call();
        let txData = etherbaseContract.methods.grantRole(role, faucetContract.options.address);
        await this._signAndSend(ownerKey, {method: txData, to: etherbaseMeta.address});

        this.contract = faucetContract;
        return faucetContract.address;
    }

    async retrieve(privateKey) {
        let method = this.contract.methods.retrieve();
        return this._signAndSend(privateKey, {to: this.contract._address, method: method, pow: true});
    }

    async retrievedAmount() {
        return await this.contract.methods.retrievedAmount().call();
    }

    async _signAndSend(privateKey, { method = '', to = '', pow = false, gas=null }) {
        let account = this.web3.eth.accounts.privateKeyToAccount(privateKey).address;
        let nonce = await this.web3.eth.getTransactionCount(account);
        let chainId = await this.web3.eth.net.getId();
        let tx = {
            from: account,
            data: method.encodeABI(),
            nonce: nonce,
            chainId: chainId
        };
        if (to) {
            tx.to = to
        }
        if (method) {
            tx.data = method.encodeABI();
            if (!gas) {
                gas = await method.estimateGas(tx);
            }
            tx.gas = gas;
        }
        if (pow) {
            await this._mineFreeGas(tx);
        }
        let signedTx = await this.web3.eth.accounts.signTransaction(tx, privateKey);
        return await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
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
