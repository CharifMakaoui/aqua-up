"use strict";

let access = require('fs').access;
let constants = require('fs').constants;
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

async function upload(url, accessToken, $filePath, $homeDir, videoInfo) {

    let thumbImage = undefined;

    if(videoInfo.thumbnail){
        const options = {
            url: videoInfo.thumbnail,
            dest: $homeDir + "/uploads/"
        };

        const { filename, image } = await download.image(options);
        thumbImage = filename;
    }


    console.log(thumbImage);

    await accessPromise($filePath, constants.F_OK);
    await accessPromise(thumbImage, constants.F_OK);

    console.log('Uploading %s video...', videoInfo.title);

    const videoAttributes = {
        name: "movie video title",
        description: "movie video description",

        fixture: $filePath,
        thumbnailfile: thumbImage,
        previewfile: thumbImage,

        tags: ["aquaScreen", "movies"],

        category: 2, // Films ==> https://peertube.maly.io/api/v1/videos/categories
        licence: 1, //  Attribution ==> https://peertube.maly.io/api/v1/videos/licences
        language: "en", // English ==> https://peertube.maly.io/api/v1/videos/languages
        privacy: 2,

        nsfw: "false",
        commentsEnabled: "true",
    };

    try {
        let videoData = await peerVideos.uploadVideo(url, accessToken, videoAttributes);

        console.log(`Video ${videoInfo.title} uploaded.`);

        return videoData.body;
    }
    catch (e){
        console.log(e);
    }
}

module.exports = {
    getAccessToken,
    upload
};
