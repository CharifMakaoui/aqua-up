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

let videoDownload = require("./helpers/downloader/videoDownloader");
let peerTubeApi = require('./helpers/uploaders/peerTube');


app.get('/ind', async function (req, res) {

    youtubedl.getInfo("https://openload.co/embed/MPEsULsaPrU", [], {}, async function (err, info) {
        if (err) {
            res.json(err);
        }

        //let uploadDir = __dirname + "/uploads/";

        let peerToken = await peerTubeApi.getAccessToken("https://peertube.maly.io", "mrcharif", "124578963Mr");
        peerTubeApi.processVideo("https://peertube.maly.io", peerToken, info, "en").then(data => {
            console.log(data);
        }).catch(error =>{
            console.log(error);
        });

        // Download video from url (this case using yt-dl)
        /*videoDownload.videoDownload(info.url, uploadDir, info.fulltitle , async (state, data) => {
            switch(state){
                case "download-progress" :
                    console.log("download progress : " + data);
                    break;

                case "download-end" :
                    let peerToken = await peerTubeApi.getAccessToken("https://peertube.maly.io", "mrcharif", "124578963Mr");
                    let upload = await peerTubeApi.upload("https://peertube.maly.io", peerToken, data, "test", "test");
                    break;

                default : console.log("default state")
            }
        });*/

        res.json(info);
    });
});

function getUrl(token, options, callback) {

    youtubedl.getInfo(token.url, options, {}, function (err, info) {
        if (err) {
            callback(true, {
                done : false,
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
            done : true,
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

            if(!error){
                let encryptedUrl = laravel.encrypt(video.response.url);
                return res.redirect('/watch/movie.mp4?token=' + encryptedUrl);
            }

            else{
                return res.json(video);
            }

        });

    }
    else{
        return res.json({
            status: 'error',
            error: 'token',
            message: 'invalid parameter for this token check your encryption key !'
        })
    }

});
app.get('/watch/:video', (req, res) => {
    let urlToPlay = laravel.decrypt(req.query.token);

    if(urlToPlay){
        let videoRequest = request(urlToPlay);
        req.pipe(videoRequest);
        videoRequest.pipe(res);
    }
    else{
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
            return res.json({ data })
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
