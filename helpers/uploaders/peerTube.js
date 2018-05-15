"use strict";

let access =  require('fs').access;
let constants =  require('fs').constants;
let isAbsolute = require('path').isAbsolute;
let promisify = require('util').promisify;

const download = require('image-downloader');

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

async function upload(url, accessToken, $filePath, $thumbPath, videoInfo) {

    const options = {
        url: videoInfo.thumbnail,
        dest: $thumbPath
    };

    const { imageFilePath, image } = await download.image(options);

    await accessPromise($filePath, constants.F_OK);
    await accessPromise(imageFilePath, constants.F_OK);

    console.log('Uploading %s video...', videoInfo.title);

    const videoAttributes = {
        name: truncate(videoInfo.title, {
            'length': 120,
            'separator': /,? +/,
            'omission': ' […]'
        }),
        category : 2, // Films ==> https://peertube.maly.io/api/v1/videos/categories
        licence : 1, //  Attribution ==> https://peertube.maly.io/api/v1/videos/licences
        language : 1, // English ==> https://peertube.maly.io/api/v1/videos/languages
        nsfw: true,
        commentsEnabled: true,
        description: videoInfo.description || undefined,
        support: undefined,
        tags : ['aquaScreen', "movie"],
        privacy: 1,
        fixture: $filePath,
        thumbnailfile : imageFilePath,
        previewfile: imageFilePath
    };

    await peerVideos.uploadVideo(url, accessToken, videoAttributes);

    console.log(`Video ${videoInfo.title} uploaded.`);
}

module.exports = {
    getAccessToken,
    upload
};
