const form = document.getElementById('deploy-form');

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const contractURI = document.getElementById('contractURI').value;
    const name = document.getElementById('name').value;
    const symbol = document.getElementById('symbol').value;
    const royaltyFee = document.getElementById('royaltyFee').value;

    const response = await fetch('/deploy', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contractURI, name, symbol, royaltyFee })
    });

    const data = await response.json();

    if (response.ok) {
        console.log(`Contract deployed at address: ${data.contractAddress}`);
    } else {
        console.error(`Error deploying contract: ${data.message}`);
    }
});
