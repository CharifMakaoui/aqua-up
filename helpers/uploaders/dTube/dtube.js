let checkStatus = require('./logics/checkStatus');
let uploadVideo = require('./logics/uploadVideo');

function uploadFile(uploadModel, dtubeModel) {
    return new Promise(async (resolve, reject) => {

        checkStatus.checkStatus()
            .then(async (uploaderUrl) => {
                console.log("uploader url ==> " + uploaderUrl);
                dtubeModel.uploadServer = uploaderUrl;

                let upload = await uploadVideo.uploadVideo(dtubeModel, uploadModel);

                console.log(upload.body);

                resolve(upload.body)

                // todo: watch progress of encoding and ipfs upload :D

            })
            .catch(error => {
                resolve({
                    type: "error",
                    message: e
                })
            });
    });
}

module.exports = {
    uploadFile
};
