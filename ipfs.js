console.log("Starting IPFS daemon...");

const IPFS = require('ipfs-daemon');
const ipfs = new IPFS();

ipfs.on('ready', () => {
    console.log("Hello, Interplanetary Friend");
    console.log(ipfs.PeerId);
    console.log(ipfs.GatewayAddress);
    console.log(ipfs.APIAddress);
})

ipfs.on('error', (e) => console.error(err));