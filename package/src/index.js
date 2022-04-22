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
const faucetAbi = require('../assets/faucet.json');

class SkaleFaucet {

    /**
     * Initialization of SkaleFaucet API client
     *
     * @class
     *
     * @param {string|object} web3Provider - A URL of SKALE endpoint or one of the Web3 provider classes
     * @param {string} faucetAddress - SkaleFaucet contract address
     */
    constructor(web3Provider, faucetAddress, difficulty=1) {
        this.web3 = new Web3(web3Provider);
        this.contract = new this.web3.eth.Contract(faucetAbi, faucetAddress);
        this.difficulty = new BN(difficulty);
    }

    async retrieve(privateKey) {
        let gas = await this.contract.methods.retrieve().estimateGas();
        console.log(gas);
        let account = this.web3.eth.accounts.privateKeyToAccount(privateKey).address;
        let nonce = await this.web3.eth.getTransactionCount(account);
        let chainId = await this.web3.eth.getChainId();
        let tx = {
            from: account,
            data: this.contract.methods.retrieve().encodeABI(),
            gas: gas,
            to: this.contract.address,
            nonce: nonce,
            chainId: chainId
        };
        let signedTx = await this.web3.eth.accounts.signTransaction(tx, privateKey);
        return await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    }

    async retrievedAmount() {
        return await this.contract.methods.retrievedAmount().call();
    }

    async _mineFreeGas(tx) {
        let nonceHash = new BN(this.web3.utils.soliditySha3(nonce).slice(2), 16)
        let addressHash = new BN(this.web3.utils.soliditySha3(address).slice(2), 16)
        let nonceAddressXOR = nonceHash.xor(addressHash)
        let maxNumber = new BN(2).pow(new BN(256)).sub(new BN(1));
        let divConstant = maxNumber.div(this.difficulty);
        let candidate;
        while (true){
            candidate = new BN(crypto.randomBytes(32).toString('hex'), 16);
            let candidateHash = new BN(this.web3.utils.soliditySha3(candidate).slice(2), 16);
            let resultHash = nonceAddressXOR.xor(candidateHash);
            let externalGas = divConstant.div(resultHash).toNumber();
            if (externalGas >= gasAmount) {
                break;
            }
        }
        tx.gasPrice = candidate.toString();
    }
}

module.exports = SkaleFaucet;
