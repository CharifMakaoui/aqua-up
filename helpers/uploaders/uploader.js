"use strict";

let fireBaseDatabase = require('./../firebase/firebaseDatabase');
let peerTubeApi = require('./peerTube/peerTube');
let openloadApi = require('./openLoad/openload');

async function initUploader(uploadModel) {

    let listPromises = [];

    Object.values(uploadModel.sessionInfo.servers).map(server => {
        switch (server.credential.server_original) {
            case "peertube" :
                listPromises.push(peerTubeUploader(uploadModel, server));
                break;

            case "openload" :
                listPromises.push(openLoadUploader(uploadModel, server));
                break;
        }
    });

    return await Promise.all(listPromises);
}

function peerTubeUploader(uploadModel, server) {

    let peerTubeModel = {
        peerServer : server.credential.api_endpoint,
        peerUsername : server.credential.api_secret,
        peerPassword : server.credential.api_key,
        peerToken : null,
        serverId : server.id,
    };

    return new Promise(async (resolve, reject) => {

        try {
            peerTubeModel.peerToken = await peerTubeApi.getAccessToken(peerTubeModel);

            peerTubeApi.upload(uploadModel, peerTubeModel)
                .then(async (uploadVideo) => {
                    await fireBaseDatabase
                        .setVideoDataComplete(uploadModel.sessionInfo.session, peerTubeModel.serverId, uploadVideo);

                    resolve('done');
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
        apiEndpoint : server.credential.api_endpoint,
        apiLogin : server.credential.api_secret,
        apiKey : server.credential.api_key,
        serverId : server.id,
    };

    return new Promise((resolve, reject) => {

        openloadApi.openLoadUpload(uploadModel, openLoadModel)
            .then(async (uploadVideo) => {
                await fireBaseDatabase.setVideoDataComplete(uploadModel.sessionInfo.session, server.id, uploadVideo);

                resolve('done');
            }).catch(error => {
                reject(error);
            });
    })
}

module.exports = {
    initUploader
};