"use strict";

let admin = require('firebase-admin');
admin.initializeApp({
    credential: admin.credential.cert({
        "type": "service_account",
        "project_id": process.env.FIREBASE_PROJECT_ID,
        "private_key_id": process.env.FIREBASE_KEY_ID,
        "private_key": process.env.FIREBASE_PRIVATE_KEY,
        "client_email": process.env.FIREBASE_CLIENT_EMAIL,
        "client_id": process.env.FIREBASE_CLIENT_ID,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://accounts.google.com/o/oauth2/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-h9vlk%40aquaupload.iam.gserviceaccount.com"
    }),
    databaseURL: 'https://aquaupload.firebaseio.com'
});
let db = admin.database();
const server_upload_ref = "server/upload/";

function getQueues() {
    return new Promise((resolve, reject) => {
        const ref = db.ref(server_upload_ref);

        ref.orderByChild('queue').equalTo("starting").once('value', data => {

            if (data.exists()) {

                data.forEach(snap => {
                    let dateNow = new Date();
                    let startAt = snap.val().startAt;
                    let diffMs = (dateNow - startAt);
                    let diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes

                    if(diffMins > 30){
                        snap.ref.update({
                            queue: "ready",
                            startAt: null,
                            serverID: null
                        })
                    }

                    reject({
                        status: "busy",
                        message: "worker in progress for now started before : " + diffMins + " minutes"
                    })
                });

            }
            else{
                ref.orderByChild('queue').equalTo("ready").limitToFirst(1).once('value', snapshot => {

                    if(snapshot.exists()){
                        let sessionInfo = null;
                        snapshot.forEach(function (data) {
                            sessionInfo = data.val();
                        });
                        resolve({
                            status: "ready",
                            data: sessionInfo
                        });
                    }else{
                        reject({
                            status: "no queue for now"
                        });
                    }

                });
            }


        });
    });

}

async function startQueue(sessionInfo) {
    let ref = db.ref(server_upload_ref + sessionInfo.session);

    return await ref.update({
        queue: "starting",
        startAt: Date.now(),
        serverID : process.env.SERVER_UNIQUE_KEY
    });
}

async function finishQueue(sessionInfo) {
    let ref = db.ref(server_upload_ref + sessionInfo.session);

    return await ref.update({
        queue: "finished",
        endAt: Date.now(),
        serverID : null
    });
}

async function createDownload(sessionInfo) {
    let ref = db.ref(server_upload_ref + sessionInfo.session);

    ref.once('value', snap => {
        let dataSave;

        if(snap.exists()){
            let lastServers = snap.val().servers;
            console.log(lastServers);

            let newServers = sessionInfo.servers;
            console.log(newServers);

            Object.values(newServers).map(server => {
                lastServers.push(server)
            });

            sessionInfo.servers = lastServers;

            sessionInfo.servers = sessionInfo.servers.filter((server, index, self) =>
                index === self.findIndex((t) => (
                    t.id === server.id && t.server_name === server.server_name
                ))
            );

            dataSave = Object.assign(snap.val(), sessionInfo, { queue: "ready" });
        }
        else {
             dataSave = Object.assign(sessionInfo, {
                queue: "ready"
            });
        }

        return ref.update(dataSave);
    });
}

async function downloadProgress(sessionId, progress) {
    let ref = db.ref(server_upload_ref + sessionId);

    await ref.update({
        download_status: progress >= 100 ? 'finished' : 'download',
        download_progress: progress
    });
}

async function uploadProgress(sessionId, serverId, progress) {
    let ref = db.ref(server_upload_ref + sessionId + "/upload/server__" + serverId);

    await ref.update({
        status: 'upload',
        upload_progress: progress
    });
}

async function setVideoDataComplete(sessionId, serverId, videoInfo , status = {status: "finished"}) {
    db.ref(server_upload_ref + sessionId + '/servers/')
        .orderByChild('id').equalTo(serverId).limitToFirst(1)
        .once('value', (snapshot) => {
            if (snapshot.exists()) {

                snapshot.forEach(data => {
                    data.ref.update({
                        status: status.status,
                    });
                });
            }
        });

    let ref = db.ref(server_upload_ref + sessionId + "/upload/server__" + serverId);

    await ref.update({
        status: status.status,
        upload_progress: 100,
        files: videoInfo
    });
}

module.exports = {
    getQueues,
    startQueue,
    finishQueue,

    createDownload,
    downloadProgress,

    uploadProgress,

    setVideoDataComplete
};