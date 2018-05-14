"use strict";

module.exports.videoDownload = function (file_url, DOWNLOAD_DIR, file_name, callback) {

    let fs = require('fs');
    let url = require('url');
    let http = require('follow-redirects').http;
    let https = require('follow-redirects').https;
    let exec = require('child_process').exec;
    let spawn = require('child_process').spawn;


    // We will be downloading the files to a directory, so make sure it's there
    // This step is not required if you have manually created the directory
    let mkdir = 'mkdir -p ' + DOWNLOAD_DIR;
    let child = exec(mkdir, function(err, stdout, stderr) {
        if (err) throw err;
        else download_file_httpGet(file_url);
    });

    // Function to download file using HTTP.get
    let download_file_httpGet = function(file_url) {
        let options = {
            host: url.parse(file_url).host,
            path: url.parse(file_url).pathname
        };

        //let file_name = url.parse(file_url).pathname.split('/').pop();
        let file = fs.createWriteStream(DOWNLOAD_DIR + file_name);

        https.get(options, function(res) {

            let len = parseInt(res.headers['content-length'], 10);
            let downloaded = 0;

            res.on('data', function(data) {
                file.write(data);
                downloaded += data.length;
                let progress = (100.0 * downloaded / len).toFixed(2);
                callback('download-progress', progress);
            }).on('end', function() {
                file.end();
                callback('download-end', DOWNLOAD_DIR + file_name);
            });
        });
    };
};