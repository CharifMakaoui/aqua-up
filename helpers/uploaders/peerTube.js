"use strict";

let access =  require('fs').access;
let constants =  require('fs').constants;
let isAbsolute = require('path').isAbsolute;
let promisify = require('util').promisify;

let peerTubeClient = require('./peerTube/getClient');
let peerTubeLogin = require('./peerTube/login');
let peerVideos = require('./peerTube/videos');


const accessPromise = promisify(access);

async function getAccessToken(url, username, password) {

    const res = await peerTubeClient.getClient(url);
    const client = {
        id: res.body.client_id,
        secret: res.body.client_secret
    };

    const user = {
        username: username,
        password: password
    };

    const res2 = await peerTubeLogin.login(url, client, user);
    const accessToken = res2.body.access_token;

    console.log(accessToken);

    return accessToken;
}

async function upload(url, accessToken,  $file, fileName, description) {
    await accessPromise($file, constants.F_OK)
    console.log('Uploading %s video...', fileName);

    const videoAttributes = {
        name: fileName,
        description: description,
        tags: ['aquascreen', 'movie'],
        fixture: $file
    };

    console.log(`Video ${fileName} uploaded.`);
    await peerVideos.uploadVideo(url, accessToken, videoAttributes)
}

module.exports = {
    getAccessToken,
    upload
};
