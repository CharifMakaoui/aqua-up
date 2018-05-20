"use strict";
let uniqid = require('uniqid'),
    firebaseDatabase = require('./../firebase/firebaseDatabase'),
    workerQueue = require('./../models').workerQueue,
    youtubeDl = require('youtube-dl'),
    models = require('./../../helpers/models'),
    videoDownload = require("./../../helpers/downloader/videoDownloader"),
    uploader = require('./../../helpers/uploaders/uploader');



async function fetchQueue() {
    firebaseDatabase.getQueues()
        .then(data => {
            return startQueue(data);
        })
        .then(async (sessionInfo) => {
            // Queue download and upload was finished :
            await firebaseDatabase.finishQueue(sessionInfo);

            console.log("Queue finished");
        })
        .catch(data => {
            console.log("error queue : ", data);
        });
}

async function startQueue(queueToStart) {

    models.uploadModel.sessionInfo = queueToStart.data;

    await firebaseDatabase.startQueue(models.uploadModel.sessionInfo);

    return new Promise((resolve, reject) => {

        youtubeDl.getInfo(models.uploadModel.sessionInfo.videoUrl, [], {}, function (err, videoInfo) {
            if (err) {
                reject(err);
            }

            models.uploadModel.videoInfo = videoInfo;
            models.uploadModel.uploadDir =
                "/uploads/" + uniqid("video_" + models.uploadModel.sessionInfo.session + "_") + "/";

            videoDownload.videoDownload(models.uploadModel, async (state, downloadData) => {

                switch (state) {
                    case "download-end" :
                        uploader.initUploader(models.uploadModel).then(() => {
                            resolve(models.uploadModel.sessionInfo);

                            //remove file from server
                            let rimraf = require('rimraf');
                            rimraf(models.uploadModel.homeDir + models.uploadModel.uploadDir, function () {
                                console.log('folder removed');
                            });
                        });
                }
            });
        });
    });


}

module.exports = {
    fetchQueue
};