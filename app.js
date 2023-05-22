const express = require('express');
const deployContract = require('./deploy');

const app = express();
app.use(express.json());
app.use(express.static('public'));

app.post('/deploy', async (req, res) => {
    console.log('Received deploy request:', req.body);

    const { contractURI, name, symbol, royaltyFee } = req.body;
    if (!(contractURI && name && symbol && royaltyFee)) {
        console.log('Missing parameters, responding with 400 status code');
        return res.status(400).json({ message: "All parameters (contractURI, name, symbol, royaltyFee) are required." });
    }

    try {
        console.log('Deploying contract...');
        const contractAddress = await deployContract(contractURI, name, symbol, royaltyFee);
        console.log('Contract deployed, responding with contract address:', contractAddress);

        return res.json({ contractAddress: contractAddress });
    } catch (err) {
        console.error('Error deploying contract:', err);
        res.status(500).json({ message: 'Error deploying contract' });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
