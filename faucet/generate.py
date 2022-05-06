import json
import os
from time import sleep

from web3 import Web3, HTTPProvider
from solcx import compile_source
from solcx import install_solc

from eth_account import Account
from etherbase_predeployed import EtherbaseGenerator
from etherbase_predeployed.address import ETHERBASE_ADDRESS
install_solc(version='latest')

endpoint = os.getenv('ENDPOINT')
w3 = Web3(HTTPProvider(endpoint))
etherbase = w3.eth.contract(
    abi=EtherbaseGenerator().get_abi(),
    address=ETHERBASE_ADDRESS
)


def generate_faucet_meta():
    with open('Faucet.sol') as f:
        code = f.read()
    compiled_sol = compile_source(
        code,
        output_values=['abi', 'bin'],
        base_path='./node_modules'
    )
    contract_interface = compiled_sol['<stdin>:Faucet']
    bytecode = contract_interface['bin']
    abi = contract_interface['abi']
    faucet = w3.eth.contract(abi=abi, bytecode=bytecode)
    return faucet


def run():
    faucet = generate_faucet_meta()
    with open('../package/assets/faucet.json', 'w+') as f:
        f.write(json.dumps({
            'abi': faucet.abi,
            'bin': faucet.bytecode.hex()
        }, indent=2))
    with open('../package/assets/etherbase.json', 'w+') as f:
        f.write(json.dumps({
            'abi': etherbase.abi,
            'address': etherbase.address
        }, indent=2))
    print('Faucet and etherbase abis are written in package/assets')


run()
