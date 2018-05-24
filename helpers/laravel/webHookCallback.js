"use strict";
let request = require('request');
let url = require('url');

function notifyUploadDone(sessionInfo, uploadedVideo) {

    let listPromises = [];

    uploadedVideo.map(video => {
        let req = new Promise((resolve, reject)=>{
            request.post({
                url: sessionInfo.callback_webhook,
                body: video,
                json: true
            },  (error, response, body) =>{
                if(error){
                    reject(error);
                }
                else{
                    resolve(body)
                }
            })
        });

        listPromises.push(req);
    });

    return Promise.all(listPromises);
}

module.exports = {
    notifyUploadDone,
};