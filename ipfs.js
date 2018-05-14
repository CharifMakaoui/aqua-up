console.log("Starting IPFS daemon...");

const IPFS = require('ipfs-daemon');
const ipfs = new IPFS();

module.exports.ipfsDemonStarter = () => {
    let isStart = false;

    let start = () => {
        ipfs.on('ready', () => {
            console.log("Hello, Interplanetary Friend");
            console.log(ipfs.PeerId);
            console.log(ipfs.GatewayAddress);
            console.log(ipfs.APIAddress);

            this.isStart = true;
        })

        ipfs.on('error', (e) =>{
            console.error(err)
            this.isStart = false;
        });
    }

    let isStarted = ()=>{
        return this.isStart
    }
}
