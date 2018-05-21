"use strict";

let fireBaseDatabase = require('./../firebase/firebaseDatabase');

module.exports.videoDownload = function (uploadModel, callback) {

    let fs = require('fs');
    let url = require('url');
    let https = require('follow-redirects').http;
    let exec = require('child_process').exec;

    let DOWNLOAD_DIR = uploadModel.homeDir + uploadModel.uploadDir;

    // We will be downloading the files to a directory, so make sure it's there
    // This step is not required if you have manually created the directory
    let mkdir = 'mkdir -p ' + DOWNLOAD_DIR;
    let child = exec(mkdir, function(err, stdout, stderr) {
        if (err) throw err;
        else download_file_httpGet(uploadModel.videoInfo.url);
    });

    // Function to download file using HTTP.get
    let download_file_httpGet = function(file_url) {
        let options = {
            host: url.parse(file_url).host,
            path: url.parse(file_url).pathname
        };

        //let file_name = url.parse(file_url).pathname.split('/').pop();
        let file = fs.createWriteStream(DOWNLOAD_DIR + uploadModel.videoInfo.fulltitle);

        console.log("start download " + uploadModel.videoInfo.fulltitle );

        https.get(options, function(res) {

            let startTime = (new Date()).getTime();

            let len = parseInt(res.headers['content-length'], 10);
            let downloaded = 0;

            res.on('data', async function(data) {
                file.write(data);
                downloaded += data.length;

                let now = (new Date()).getTime();
                let speed = ((downloaded / (now - startTime)) / 24).toFixed(2);

                let progress = (100.0 * downloaded / len).toFixed(2);
                console.log("video download progress : " + progress + " download speed : " + speed + "kb");

                let _progress = (100.0 * downloaded / len).toFixed(0);
                /*if(_progress % 2 === 0)
                    callback('download-progress', progress);
                    await fireBaseDatabase.downloadProgress(uploadModel.sessionInfo.session, _progress);*/

            }).on('end', function() {
                file.end();
                let filePath = DOWNLOAD_DIR + uploadModel.videoInfo.fulltitle;
                uploadModel.filePath = filePath;
                callback('download-end', filePath);
            });
        });
    };
};