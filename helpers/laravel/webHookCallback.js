"use strict";
let request = require('request');

function notifyProcessEnd(sessionInfo, videoInfo, callback) {

    return request()
        .post(sessionInfo.callback_url, {
            session_id: sessionInfo.session
        }, (error, response, body) => {
            if(error)
                callback("error", error);

            callback('success', body)
        })

}