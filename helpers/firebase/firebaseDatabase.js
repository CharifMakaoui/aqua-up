"use strict";

let admin = require('firebase-admin');
admin.initializeApp({
    credential: admin.credential.cert({
        "type": "service_account",
        "project_id": "aquaupload",
        "private_key_id": "86d473329b729929e49e901a9085b812997c3913",
        "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC+CC1TEl5kcUGk\nFLe5rNSmC5qiNr6RyHesP9HvoNKNM0BzuO5R4aiLvibnA4IjxljhEa1ID1bbzmSw\nV2RddkuFrhqO0FkmNCJmbfojLxxEKZnczpPdzIOumeKYzBz7BukzAgHsRJEAEVBS\nYIWBdcJmAo/ujOl4QxJD8YfUdHHN8TJt0WmD2zivZvZB2rSwTyeXOBZyHtyvo6JV\nAELzTdN1pdYFHXSqCxx8Z9IqLgC5W33tAV5sg5z1457Y+DaQ6i/y9pglyrOdfd60\nQwEpmU007wX7pCe62HDWvwbMwFv0m+G7zBsn9fRCc5b9MZLwCR7qBQ9nRK9vJbpX\nU03okcc/AgMBAAECggEAXM22gNLAKVJMKbr6bKF0ajDRkDWnBJ//na2/M0T5fn6Q\nk9M1A+TtwG0ZJ4mFlT4I6sWMt9vR4d+eOaY8PA6I3FyF2Mf0OZ2NTTOZTHR12+3r\nF7QE73Uwu+SoDlHkN02NNl1dHgrwOzW5YbmEiZA+Yz4OF4RWgmZS9b5vRLinWViB\nY42/tvV9F7K0Q4Y7sIQ9dRD35PLCyrt9Kr6Hs6wnwpxq5UsR72aJu+PGz1LTjRpF\ns9IXutxkKU8vnefYA1Va7uh/XzlZiqk1tUnccBUOmTjVpCjc4bNKJlbVI4LfLIT2\nxRXdcMy4ffRrZj+Ajeet/HlSv7GsUE4zAetg642q4QKBgQDkqNnv66EZFsQEDXYg\nvd146sv3PAj9V2Ol6XoPqiBAr0AFFpY/Cfee4WqZpMTC0N69lRC7uNVbhoQ0VY/M\n9FhKiKcShtJ7R0z5KnFiFQV09pNvtSP/yUbUYslkdvMWno6ORGRL4si5xr/k1k22\nGMOaR8BpUhV2kYXKvwsZO61snwKBgQDUwPRMIPhMXvzwXwN6FeL0fr0h3xlhxTaF\nPBEZ1B+PbvWWXj3BmwBQGAUChYizkIMIJXx9uX+r4xwsFlnV8IdNyIHKg+63L9HQ\nY9c/Iyexn73W1yCyNA9b1cVVqFf0Glx4WgiR3xfKMGldqDd2PUGTXbix7bdDP4QM\n2lXqrDEBYQKBgGgfZ5Zz8tjs3/eEdb01GCvep2B+yw0qBStg5P9LFgK+iuWGQoaU\nMFj+Br/OIvcfi75CqesBoM5bs8ntCF1pCudt0L6D/Ea80hVIOXdTYTfArKSalLj+\nW62NCm4gKFOtgfbQt+dCbusB0RIQcDSylCel8r1C7pkebRFE63XjEfa7AoGBAIZI\np6lpYe8qQTIidlpXeCFj4VKAs0+Pn4Lmz9Bin+zzVxUqtIX/pGnpTzgxOoBD5UB+\nEJ52N8wxE7YMAXXUVEJXHPzK2yBKkX6bld9m/AXT0onIzP1NeKg5PE19bM5I2Tap\ndSFFE4ntloOjyiXaMgqmrA26AeLzMxC9ul7dgizhAoGBAMEmNc2++12nh0hI4eh8\nTtYdQZFE7ZRDkPuHBGXUg9RmwClTKVOwhUzLvLbkn0l2wf1mv95b8s7ZgyXCb8qx\nIvFhGACYBLiF5QHsnXNbsPsmDVoAb1fjzOaDCwJD7nCuxe0H+PaHlTBoPUbOONbi\n4cacN6HyatSSGRaOw5YIYqcp\n-----END PRIVATE KEY-----\n",
        "client_email": "firebase-adminsdk-h9vlk@aquaupload.iam.gserviceaccount.com",
        "client_id": "113362628261957946186",
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
                    secondDate = new Date.now(),
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

                console.log(snapshot.ref);

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