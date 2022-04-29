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
 * @file index.test.js
 * @copyright SKALE Labs 2019-Present
 */
const SkaleFaucet = require('../src/index');
var Web3HttpProvider = require('web3-providers-http');
const chai = require('chai');
const assert = chai.assert;

describe('Test SkaleFaucet', function () {

    let faucet;
    before(async function () {
        var provider = new Web3HttpProvider(process.env.ENDPOINT, {keepAlive: true, timeout: 600000});
        faucet = new SkaleFaucet(process.env.ENDPOINT, process.env.FAUCET_ADDRESS);
    });

    describe('Test constructor', function () {
        it('should get money to account', async function () {
            let account = await faucet.web3.eth.accounts.create();
            await faucet.retrieve(account.privateKey);
            let newBalance = await faucet.web3.eth.getBalance(account.address);
            assert.isTrue(newBalance > 0, "balance didn't change");
        });
    });
});
