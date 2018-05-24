"use strict";
let uniqid = require('uniqid'),
    firebaseDatabase = require('./../firebase/firebaseDatabase'),
    workerQueue = require('./../models').workerQueue,
    youtubeDl = require('youtube-dl'),
    models = require('./../../helpers/models'),
    videoDownload = require("./../../helpers/downloader/videoDownloader"),
    uploader = require('./../../helpers/uploaders/uploader');

let Storage = require('node-storage');


function fetchQueue() {

    let store = new Storage('./store.json');
    let RunningQueue = store.get('RunningQueue');
    console.log("RunningQueue : " + RunningQueue);

    if(!RunningQueue || RunningQueue === undefined){
        firebaseDatabase.getQueues()
            .then(queueToStart => {
                store.put('RunningQueue', true);
                return startQueue(queueToStart);
            })
            .then(async (sessionInfo) => {
                // Queue download and upload was finished :
                await firebaseDatabase.finishQueue(sessionInfo);

                store.put('RunningQueue', false);
                console.log("Queue finished");
                fetchNextQueue()
            })
            .catch(data => {
                console.log("error queue : ", data);
                store.put('RunningQueue', false);
                fetchNextQueue()
            });
    } else {
        console.log("another queue in progress");
        fetchNextQueue()
    }

}

function fetchNextQueue(){
    setTimeout(() => {
        fetchQueue();
    }, 1000 * 60 * 5);
}

function startQueue(queueToStart) {
    return new Promise(async (resolve, reject) => {

        if (!queueToStart) {
            reject("no queue at available at this time");
            return;
        }

        models.uploadModel.sessionInfo = queueToStart.data;

        await firebaseDatabase.startQueue(models.uploadModel.sessionInfo);


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