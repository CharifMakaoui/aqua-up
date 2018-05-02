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

app.get('/url/:token', (req, res) =>{

    let token = JSON.parse(laravel.decrypt(req.params.token));

    if(token){

        let url = 'https://openload.co/embed/8PuTf23ybmo';
        let options = [];

        youtubedl.getInfo(url, options, {}, function(err, info) {
            if (err) throw err;

            console.log('id:', info.id);
            console.log('title:', info.title);
            console.log('url:', info.url);
            console.log('thumbnail:', info.thumbnail);
            console.log('description:', info.description);
            console.log('filename:', info._filename);
            console.log('format id:', info.format_id);

            res.json({
                status : "done",
                data : info
            })
        });
    }
    else {
        res.json({
            status : 'error',
            error : 'token',
            message : 'invalid parameter for this token check your encryption key !'
        })
    }

});

app.get('/init/:token', (req, res) => {

    let token = JSON.parse(laravel.decrypt(req.params.token));

    if(token){
        request('http://localhost:1337/api/info?url=' + token.url + '&flatten=False', function (error, response, body) {

            // create new token
            if(body){
                body = JSON.parse(body);
                let createAt = new Date();

                if(body.hasOwnProperty('error')){
                    return res.json({
                        status : 'error',
                        message : body.error
                    });
                }

                let data = {
                    title : body.info.title,
                    url   : body.info.url,
                    server   : token.server,
                    createAt : createAt.getTime()
                };

                return res.json({
                    status: 'ticket',
                    response : data,
                })
            }

        });
    }
    else {
        res.json({
            status : 'error',
            error : 'token',
            message : 'invalid parameter for this token check your encryption key !'
        })
    }


    /*let video = request('http://localhost:1337/api/play?url=' + token.url);
    req.pipe(video);
    video.pipe(res);*/
});

app.get('/stream/:name', (req, res) => {

    let urlToPaly = laravel.decrypt(req.query.token);

    let video = request(urlToPaly);
    req.pipe(video);
    video.pipe(res);

});


app.listen(process.env.PORT || 5000);
