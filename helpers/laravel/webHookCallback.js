"use strict";
let request = require('request');

async function notifyUploadDone(sessionInfo, uploadedVideo) {

    return request()
        .post(sessionInfo.callback_webhook, uploadedVideo)
        .expect(200)

}

module.exports = {
    notifyUploadDone,
};