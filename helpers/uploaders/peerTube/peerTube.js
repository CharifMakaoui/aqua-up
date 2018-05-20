"use strict";

let access = require('fs').access;
let constants = require('fs').constants;
let promisify = require('util').promisify;

const download = require('image-downloader');

const parseTorrent = require('parse-torrent');
let libHash = require("./../../ffmpegEncoding/videoHash");

let peerTubeClient = require('./logics/getClient');
let peerTubeLogin = require('./logics/login');
let peerVideos = require('./logics/videos');

let uniqid = require('uniqid');

const accessPromise = promisify(access);

async function getAccessToken(peerTubedModel) {

    const res = await peerTubeClient.getClient(peerTubedModel);
    const client = {
        id: res.body.client_id,
        secret: res.body.client_secret
    };

    const user = {
        username: peerTubedModel.peerUsername,
        password: peerTubedModel.peerPassword
    };

    const res2 = await peerTubeLogin.login(peerTubedModel.peerServer, client, user);
    return res2.body.access_token;
}

function upload(uploadModel, peerTubedModel) {

    return new Promise(async (resolve, reject) => {

        await accessPromise(uploadModel.filePath, constants.F_OK);

        // set video thumb if exist on model
        let thumbImage = undefined;
        if (uploadModel.videoInfo.thumbnail) {
            const options = {
                url: uploadModel.videoInfo.thumbnail,
                dest: uploadModel.homeDir + "/uploads/"
            };

            const {filename, image} = await download.image(options);
            thumbImage = filename;
            await accessPromise(thumbImage, constants.F_OK);
        }

        console.info('Uploading %s video...', uploadModel.sessionInfo.movie_name);

        const videoAttributes = {
            name: uploadModel.sessionInfo.movie_name,
            description: uploadModel.sessionInfo.movie_name,

            fixture: uploadModel.filePath,
            thumbnailfile: thumbImage,
            previewfile: thumbImage,

            tags: uploadModel.sessionInfo.movie_name.replace(/[^a-zA-Z0-9 ]/g, "").split(' '),

            category: 2, // Films ==> https://peertube.maly.io/api/v1/videos/categories
            licence: 1, //  Attribution ==> https://peertube.maly.io/api/v1/videos/licences
            language: "en", // English ==> https://peertube.maly.io/api/v1/videos/languages
            privacy: 2,

            nsfw: "false",
            commentsEnabled: "true",
        };

        try {
            let videoData = await peerVideos.uploadVideo(uploadModel, peerTubedModel, videoAttributes);

            console.info("uploaded video body response : ", videoData.body.video);
            console.info(`Video ${uploadModel.sessionInfo.movie_name} uploaded. uuid ==> ${videoData.body.video.uuid}`);

            let videoInfo = await peerVideos.getVideo(peerTubedModel, videoData.body.video.uuid);

            let videoInfoModel = require('./../../models').videoInfo;

            let dataToSave = [];

            libHash.computeHash(uploadModel.filePath).then(videoHash => {

                videoInfo.body.files.map(video => {
                    const dataSerialise = Object.assign(videoInfoModel, {
                        is_torrent: true,
                        status: "working",

                        file_id: videoInfo.body.uuid,
                        upload_id: uniqid(),

                        belong: uploadModel.sessionInfo.type,
                        server_id: peerTubedModel.serverId,
                        parent_id: uploadModel.sessionInfo.session,

                        torrent_magnet: video.magnetUri,
                        torrent_hash: parseTorrent(video.magnetUri).infoHash,

                        file_url: video.fileUrl,

                        video_quality: video.resolution.label,
                        video_hash : videoHash.videoHash,
                        video_bytes_size : videoHash.videoByteSize,
                    });

                    dataToSave.push(dataSerialise)
                });

                resolve(dataToSave)

            });

        }
        catch (e) {
            reject({
                type: "error",
                message: e
            })
        }

    });
}

module.exports = {
    getAccessToken,
    upload
};
