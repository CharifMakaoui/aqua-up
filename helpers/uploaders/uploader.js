"use strict";

let fireBaseDatabase = require('./../firebase/firebaseDatabase');
let peerTubeApi = require('./peerTube/peerTube');
let openloadApi = require('./openLoad/openload');
let dTubeApi = require('./dTube/dtube');

let webHookCallback = require('./../laravel/webHookCallback');

async function initUploader(uploadModel) {

    let listPromises = [];

    Object.values(uploadModel.sessionInfo.servers).map(server => {
        if (!(server.status && server.status === "finished")) {
            switch (server.credential.server_original) {
                case "peertube" :
                    listPromises.push(peerTubeUploader(uploadModel, server));
                    break;

                case "openload" :
                    listPromises.push(openLoadUploader(uploadModel, server));
                    break;

                case "dtube" :
                    listPromises.push(dTubeUploader(uploadModel, server));
                    break;
            }
        }
        else {
            console.log("upload to this server : " + server.id + " is finished before that")
        }

    });

    return await Promise.all(listPromises);
}

function peerTubeUploader(uploadModel, server) {

    let peerTubeModel = {
        peerServer: server.credential.api_endpoint,
        peerUsername: server.credential.api_secret,
        peerPassword: server.credential.api_key,
        peerToken: null,
        serverId: server.id,
    };

    return new Promise(async (resolve, reject) => {

        try {
            peerTubeModel.peerToken = await peerTubeApi.getAccessToken(peerTubeModel);

            peerTubeApi.upload(uploadModel, peerTubeModel)
                .then(async (uploadVideo) => {

                    await onFinish(uploadModel, uploadVideo, peerTubeModel.serverId);

                    resolve("done");
                })
                .catch(error => {
                    console.log(error);
                });

        }
        catch (e) {
            reject(e);
        }


    });
}

function openLoadUploader(uploadModel, server) {

    let openLoadModel = {
        apiEndpoint: server.credential.api_endpoint,
        apiLogin: server.credential.api_secret,
        apiKey: server.credential.api_key,
        serverId: server.id,
    };

    return new Promise((resolve, reject) => {

        openloadApi.openLoadUpload(uploadModel, openLoadModel)
            .then(async (uploadVideo) => {
                await onFinish(uploadModel, uploadVideo, openLoadModel.serverId);

                resolve("done");
            })
            .catch(error => {
                reject(error);
            });
    })
}

function dTubeUploader(uploadModel, server) {
    let dtubeModel = {
        uploadServer: null,
        uploadToken: null,
        serverId: server.id,
    };

    return new Promise((resolve, reject) => {
        dTubeApi.uploadFile(uploadModel, dtubeModel)
            .then(async (uploadVideo) => {

                await fireBaseDatabase.setVideoDataComplete(uploadModel.sessionInfo.session, server.id, uploadVideo);

                resolve('done');
            }).catch(error => {
            reject(error);
        })
    });
}

async function onFinish(uploadModel, uploadVideo, serverId) {

    if (uploadVideo.type && uploadVideo.type === "error") {
        await fireBaseDatabase
            .setVideoDataComplete(
                uploadModel.sessionInfo.session,
                serverId,
                uploadVideo,
                {
                    status: "error"
                });

        console.log("promise error : ", uploadVideo.message)
    }
    else {

        webHookCallback.notifyUploadDone(uploadModel.sessionInfo, uploadVideo)
            .then(async (data) => {
                await fireBaseDatabase
                    .setVideoDataComplete(uploadModel.sessionInfo.session, serverId, uploadVideo);
            })
            .catch(async (error) => {
                await fireBaseDatabase
                    .setVideoDataComplete(uploadModel.sessionInfo.session, serverId, uploadVideo, {
                        status: "error_save_webHook"
                    });
            });
    }
}

module.exports = {
    initUploader
};