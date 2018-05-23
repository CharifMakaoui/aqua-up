let request = require('supertest');

let dTubeUploaders = [
    "https://upldr5.d.tube",
    "https://upldr1.d.tube",
    "https://upldr3.d.tube",
];

function checkStatus() {
    return new Promise(async (resolve, reject) => {

        let queuethreshold = 3;
        let finished = false;
        let results = [];

        for(let i = 0; i < dTubeUploaders.length; i++){
            try {
                if(!finished){
                    let _request = await request(dTubeUploaders[i])
                        .get("/getStatus")
                        .set('Accept', '*/*')
                        .set('Origin', 'https://d.tube')
                        .expect(200)
                        .expect('Content-Type', /json/);

                    let response = _request.body;

                    console.log(response);

                    let totalQueueSize = 0;
                    if (response.version === '0.6.6' || response.currentWaitingInQueue.version) {
                        totalQueueSize += response.currentWaitingInQueue.ipfsToAddInQueue;
                        totalQueueSize += response.currentWaitingInQueue.spriteToCreateInQueue;
                        totalQueueSize += response.currentWaitingInQueue.videoToEncodeInQueue;
                    } else {
                        totalQueueSize += response.currentWaitingInQueue.audioCpuToEncode;
                        totalQueueSize += response.currentWaitingInQueue.videoGpuToEncode;
                        totalQueueSize += response.currentWaitingInQueue.audioVideoCpuToEncode;
                        totalQueueSize += response.currentWaitingInQueue.spriteToCreate;
                        totalQueueSize += response.currentWaitingInQueue.ipfsToAdd;
                    }

                    results.push({
                        upldr: dTubeUploaders[i],
                        totalQueueSize: totalQueueSize
                    });

                    if (totalQueueSize < queuethreshold && !finished) {
                        resolve(dTubeUploaders[i]);
                        finished = true;
                    }
                }
            }
            catch (e) {
                console.log(e);
                reject(e);
            }
        }

        let bestEndpoint = results.sort(function (a, b) {
            return a.totalQueueSize - b.totalQueueSize
        })[0];

        resolve(bestEndpoint.upldr);

        console.log("finished");
    });
}

module.exports = {
    checkStatus
};