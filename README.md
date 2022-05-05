# skale-faucet
SKALE Chain Faucet for sFUEL distribution and NPM client for usage

## Deploy Faucet

```shell
cd faucet
pip install -r requirements.txt
yarn
ENDPOINT=https://<YOUR_SKALE_ENDPOINT> PRIVATE_KEY=0x1234... python deploy.py
```

Expected Result:

```
Faucet is deployed on 0xFb7486694CC9800E1335Cb7dc129A4246Ef53bFD
Faucet abi is written in faucet.json
Faucet is linked to Etherbase
```

## Run Tests

```shell
cd ../package
yarn
ENDPOINT=https://<YOUR_SKALE_ENDPOINT> PRIVATE_KEY=0x1234... FAUCET_ADDRESS=0xFb7486694CC9800E1335Cb7dc129A4246Ef53bFD yarn test
```