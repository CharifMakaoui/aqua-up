"use strict";

require('dotenv').config();

let express = require('express');
let request = require('request');
let app = express();
let server = require('http').createServer(app);

app.use(express.static(__dirname + '/node_modules'));
app.use(express.static(__dirname + '/public'));

let laravel = require('./helpers/laravel/laravel-decript');
let youtubedl = require('youtube-dl');

let models = require('./helpers/models');
models.uploadModel.homeDir = __dirname;

let uploader = require('./helpers/uploaders/uploader');

let fireBaseDatabase = require('./helpers/firebase/firebaseDatabase');

let queueWorker = require('./helpers/worker/queuWorker');


app.get('/upload/to-torrent', async function (req, res) {

    let requestData = JSON.parse(laravel.decrypt(req.query.token));

    if (requestData) {

        // Extract request data
        try {
            await fireBaseDatabase.createDownload(requestData);

            await queueWorker.fetchQueue();

            return res.json({
                "status": "queue",
                "message": "download queue created"
            })
        }
        catch (e){
            return res.json({
                status: 'error',
                error: 'extract info',
                message: 'invalid data extraction from token !',
                stack: e.message,
            })
        }

    }
    else {
        return res.json({
            status: 'error',
            error: 'token',
            message: 'invalid parameter for this token check your encryption key !'
        })
    }
});

function getUrl(token, options, callback) {

    youtubedl.getInfo(token.url, options, {}, function (err, info) {
        if (err) {
            callback(true, {
                done: false,
                status: 'error',
                message: err
            });
        }

        let createAt = new Date();

        let data = {
            title: info.title,
            url: info.url,
            server: token.server,
            createAt: createAt.getTime()
        };

        callback(false, {
            done: true,
            status: 'ticket',
            response: data,
        });
    });
}

// in this version we get url and encrypt it to direct redirect to stream video
app.get("/prepare/:video", (req, res) => {
    let token = JSON.parse(laravel.decrypt(req.query.token));

    if (token) {

        let options = [];
        getUrl(token, options, (error, video) => {

            if (!error) {
                let encryptedUrl = laravel.encrypt(video.response.url);
                return res.redirect('/watch/movie.mp4?token=' + encryptedUrl);
            }

            else {
                return res.json(video);
            }

        });

    }
    else {
        return res.json({
            status: 'error',
            error: 'token',
            message: 'invalid parameter for this token check your encryption key !'
        })
    }

});
app.get('/watch/:video', (req, res) => {
    let urlToPlay = laravel.decrypt(req.query.token);

    if (urlToPlay) {
        let videoRequest = request(urlToPlay);
        req.pipe(videoRequest);
        videoRequest.pipe(res);
    }
    else {
        return res.json({
            status: 'error',
            error: 'token',
            message: 'invalid parameter for this token check your encryption key !'
        })
    }

});

// this version return video url and you send second request to stream video after you encrypt it in your backend
app.get('/init/:token', (req, res) => {

    let token = JSON.parse(laravel.decrypt(req.params.token));

    if (token) {

        let options = [];

        getUrl(token, options, (error, data) => {
            return res.json({data})
        });
    }
    else {
        return res.json({
            status: 'error',
            error: 'token',
            message: 'invalid parameter for this token check your encryption key !'
        })
    }

});
app.get('/stream/:name', (req, res) => {
    let urlToPaly = laravel.decrypt(req.query.token);

    let video = request(urlToPaly);
    req.pipe(video);
    video.pipe(res);
});

server.listen(process.env.PORT || 5000);
console.log("server running on localhost:" + (process.env.PORT || 5000));
