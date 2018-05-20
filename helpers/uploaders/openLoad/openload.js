let uniqid = require('uniqid');

let libHash = require("./../../ffmpegEncoding/videoHash");

let getUploadUrl = require('./logics/getUploadUrl');
let uploadFile = require('./logics/uploadFile');

function openLoadUpload(uploadModel, openLoadModel) {

    return new Promise(async (resolve, reject) => {
        try {
            let openloadUrl = await getUploadUrl.getUploadUrl(openLoadModel);

            openLoadModel.uploadUrl = JSON.parse(openloadUrl.text).result.url;

            let videoInfo = await uploadFile.openLoadUploadFile(uploadModel, openLoadModel);

            let videoInfoModel = require('./../../models').videoInfo;
            let dataToSave = [];

            libHash.computeHash(uploadModel.filePath).then(videoHash => {

                const dataSerialise = Object.assign(videoInfoModel, {
                    is_torrent: false,
                    status: "working",

                    file_id: videoInfo.body.result.id,
                    upload_id: uniqid(),

                    belong: uploadModel.sessionInfo.type,
                    server_id: openLoadModel.serverId,
                    parent_id: uploadModel.sessionInfo.session,

                    torrent_magnet: null,
                    torrent_hash: null,

                    file_url: videoInfo.body.result.url,

                    video_quality: uploadModel.sessionInfo.quality,
                    video_hash : videoHash.videoHash,
                    video_bytes_size : videoHash.videoByteSize,
                });

                dataToSave.push(dataSerialise);

                resolve(dataToSave);

            });
        }
        catch (e){
            reject(e);
        }



    })
}

module.exports = {
    openLoadUpload
};