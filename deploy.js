const { ethers } = require('ethers');
const fs = require('fs');
const https = require('https');

// Replace this with the actual path to your contract's JSON artifact
const contractArtifact = JSON.parse(fs.readFileSync('./contracts/NFTredux.json'));

const contractABI = contractArtifact.abi;
const contractBytecode = contractArtifact.bytecode;

const providerUrl = 'https://polygon-mainnet.infura.io/v3/615e0266e5284aeeb5863c6731dbf11e';
const privateKey = '5dd0dc3c78280ed01cc4ced184209480d51107ff689e10c859606210281dbeec'; //0xa30b3860e7e02dc56ED3d4967FbA70E824219404

const provider = new ethers.providers.JsonRpcProvider(providerUrl);
const wallet = new ethers.Wallet(privateKey, provider);

function getGasPrice() {
    return new Promise((resolve, reject) => {
        https.get('https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice&apikey=EDAZE1TPZHRXMGR6EPNG3U16RQ28YXQ6WW', (res) => {
            let data = '';

            // A chunk of data has been received.
            res.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received.
            res.on('end', () => {
                const parsedData = JSON.parse(data);
                const gasPriceWei = ethers.BigNumber.from(parsedData.result);
                const gasPriceGwei = ethers.utils.formatUnits(gasPriceWei, 'gwei');
                const gasPrice = parseFloat(gasPriceGwei);
                const MAX_GAS_PRICE_GWEI = 500;

                if (gasPrice > MAX_GAS_PRICE_GWEI) {
                    reject(new Error(`Gas price ${gasPrice} Gwei exceeds maximum allowed ${MAX_GAS_PRICE_GWEI} Gwei`));
                }
                resolve(gasPrice);
            });

        }).on('error', (err) => {
            reject(err);
        });
    });
}




async function deployContract(contractURI, name, symbol, royaltyFee) {
    console.log('Creating Contract Factory...');
    const ContractFactory = new ethers.ContractFactory(contractABI, contractBytecode, wallet);

    // Get the current transaction count
    const nonce = await wallet.getTransactionCount();

    // Prepare the contract deployment transaction
    const deployTx = ContractFactory.getDeployTransaction(contractURI, name, symbol, royaltyFee);

    // Estimate gas usage
    console.log('Estimating gas usage...');
    const gasEstimate = await wallet.estimateGas(deployTx);

    // Increase gas limit by 30%
    const gasLimit = gasEstimate.mul(200).div(100); // Increased the limit further

    const gasPrice = await getGasPrice();
    console.log('Current gas price:', gasPrice, 'Gwei');

    // Round gas price to 9 decimal places
    let adjustedGasPrice = gasPrice * 1.2;
    adjustedGasPrice = Math.round(adjustedGasPrice * 1e9) / 1e9;
    const gasPriceWei = ethers.utils.parseUnits(adjustedGasPrice.toString(), 'gwei');

    console.log('Deploying contract...');
    const overrides = {
        gasLimit: gasLimit,  // Gas limit increased by 100%.
        gasPrice: gasPriceWei,  // Optional gas price. Increased to the current gas price
        nonce: nonce, // Use the current transaction count as the nonce
    };

    const contract = await ContractFactory.deploy(contractURI, name, symbol, royaltyFee, overrides);

    console.log('Deployment transaction hash:', contract.deployTransaction.hash);

    console.log('Waiting for contract deployment...');
    await contract.deployed();

    console.log('Contract deployed at:', contract.address);
    return contract.address;
}


module.exports = deployContract;
