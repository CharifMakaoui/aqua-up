"use strict";

require('dotenv').config();
let express = require('express');
let request = require('request');
let app = express();
let laravel = require('./helpers/laravel-decript');
let youtubedl = require('youtube-dl');


app.get('/', function (req, res) {
    return res.send('coming soon!');
});

function getUrl(token, options) {

    youtubedl.getInfo(token.url, options, {}, function (err, info) {
        if (err) {
            return {
                done : false,
                status: 'error',
                message: err
            };
        }

        let createAt = new Date();

        let data = {
            title: info.title,
            url: info.url,
            server: token.server,
            createAt: createAt.getTime()
        };


        return {
            done : true,
            status: 'ticket',
            response: data,
        }
    });
}

app.get('/init/:token', (req, res) => {

    let token = JSON.parse(laravel.decrypt(req.params.token));

    if (token) {

        let options = [];

        return res.json(getUrl(token, options));
    }
    else {
        return res.json({
            status: 'error',
            error: 'token',
            message: 'invalid parameter for this token check your encryption key !'
        })
    }

});

app.get("/watch/:video", (req, res) => {
    let token = JSON.parse(laravel.decrypt(req.query.token));

    if (token) {

        let options = [];
        let video = getUrl(token, options);

        if(video.done){
            let videoRequest = request(video.url);
            req.pipe(videoRequest);
            return videoRequest.pipe(res);
        }
    }

    return res.json({
        status: 'error',
        error: 'token',
        message: 'invalid parameter for this token check your encryption key !'
    })
});

app.get('/stream/:name', (req, res) => {

    let urlToPaly = laravel.decrypt(req.query.token);

    let video = request(urlToPaly);
    req.pipe(video);
    video.pipe(res);
});


app.listen(process.env.PORT || 5000);
