/**
 * @license
 * SKALE Filestorage-js
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
 * @copyright SKALE Labs 2019-Present
 */

const Web3 = require('web3');
const faucetAbi = require('./assets/faucet.json');

class SkaleFaucet {

    /**
     * Initialization of SkaleFaucet API client
     *
     * @class
     *
     * @param {string|object} web3Provider - A URL of SKALE endpoint or one of the Web3 provider classes
     * @param {string} faucetAddress - SkaleFaucet contract address
     */
    constructor(web3Provider, faucetAddress) {
        this.web3 = new Web3(web3Provider);
        this.contract = new web3.eth.Contract(faucetAbi, faucetAddress);
    }
}

module.exports = SkaleFaucet;
