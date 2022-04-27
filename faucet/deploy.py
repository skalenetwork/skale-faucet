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
pk = os.getenv('PRIVATE_KEY')
base_amount = os.getenv('AMOUNT') or 1000000
total_amount = os.getenv('TOTAL') or 1000000000

address = Account.from_key(pk).address
w3 = Web3(HTTPProvider(endpoint))
etherbase = w3.eth.contract(
    abi=EtherbaseGenerator().get_abi(),
    address=ETHERBASE_ADDRESS
)


def sign_and_send(tx):
    signed = w3.eth.account.signTransaction(tx, pk)
    tx_hash = w3.eth.sendRawTransaction(signed['rawTransaction'])
    sleep(5)
    while True:
        try:
            tx_receipt = w3.eth.getTransactionReceipt(tx_hash.hex())
            if tx_receipt:
                break
        except:
            sleep(1)
    return dict(tx_receipt)


def deploy_faucet():
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
    tx = faucet.constructor(base_amount, total_amount).buildTransaction({
        'nonce': w3.eth.getTransactionCount(address),
        'gas': 1000000,
        'gasPrice': 100000
    })
    tx_receipt = sign_and_send(tx)
    faucet_addr = tx_receipt['contractAddress']
    return w3.eth.contract(abi=abi, address=faucet_addr)


def link_to_etherbase(faucet_addr):
    ether_manager_role = etherbase.functions.ETHER_MANAGER_ROLE().call()
    tx = etherbase.functions.grantRole(ether_manager_role, faucet_addr).buildTransaction({
        'nonce': w3.eth.getTransactionCount(address),
        'gas': 1000000,
        'gasPrice': 100000
    })
    return sign_and_send(tx)


def run():
    faucet = deploy_faucet()
    print(f'Faucet is deployed on {faucet.address}')
    with open('../package/assets/faucet.json', 'w+') as f:
        f.write(json.dumps(faucet.abi, indent=2))
        print('Faucet abi is written in faucet.json')
    link_to_etherbase(faucet.address)
    print(f'Faucet is linked to Etherbase')

    # Test if you need
    # test(faucet)

run()