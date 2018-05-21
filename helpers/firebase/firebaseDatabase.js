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

        ref.orderByChild('queue').equalTo("starting").limitToFirst(1).once('value', data => {

            if (data.exists()) {

                let firstDate = new Date(data.val().startAt),
                    secondDate = new Date(Date.now()),
                    timeDifference = Math.abs(secondDate.getTime() - firstDate.getTime());

                reject({
                    status: "busy",
                    message: "worker in progress for now started before : " + timeDifference
                })
            }

            ref.orderByChild('queue').equalTo("ready").limitToFirst(1).once('value', snapshot => {

                let sessionInfo = null;
                snapshot.forEach(function (data) {
                    sessionInfo = data.val();
                });
                resolve({
                    status: "ready",
                    data: sessionInfo
                });
            });
        });
    });

}

async function startQueue(sessionInfo) {
    let ref = db.ref(server_upload_ref + sessionInfo.session);

    return await ref.update({
        queue: "starting",
        startAt: Date.now()
    });
}

async function finishQueue(sessionInfo) {
    let ref = db.ref(server_upload_ref + sessionInfo.session);

    return await ref.update({
        queue: "finished",
        endAt: Date.now()
    });
}

async function createDownload(sessionInfo) {
    let ref = db.ref(server_upload_ref + sessionInfo.session);

    let dataSave = Object.assign(sessionInfo, {
        queue: "ready"
    });

    return await ref.update(dataSave);
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

async function setVideoDataComplete(sessionId, serverId, videoInfo) {
    db.ref(server_upload_ref + sessionId + '/servers/')
        .orderByChild('id').equalTo(serverId).limitToFirst(1)
        .once('value', (snapshot) => {
            if (snapshot.exists()) {

                snapshot.forEach(data => {
                    data.ref.update({
                        status: 'finished',
                    });
                });
            }
        });

    let ref = db.ref(server_upload_ref + sessionId + "/upload/server__" + serverId);

    await ref.update({
        status: 'finished',
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