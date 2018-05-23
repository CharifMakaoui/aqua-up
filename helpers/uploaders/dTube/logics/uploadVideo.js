let request = require('supertest');
let fireBaseDatabase = require('../../../firebase/firebaseDatabase');

async function uploadVideo(dtubeModel, uploadModel, specialStatus = 200) {


    let path = "/uploadVideo?videoEncodingFormats=240p,480p,720p&sprite=true";

    return request(dtubeModel.uploadServer)
        .post(path)
        .set('Accept', 'application/json')
        .attach('files', uploadModel.filePath)
        .on('progress', async function (e) {
            let _progress = (100.0 * e.loaded / e.total).toFixed(0);
            console.log(`dtube server : ${dtubeModel.serverId} upload progress : `, _progress);
            /*if(_progress % 2 === 0)
                await fireBaseDatabase.uploadProgress(uploadModel.sessionInfo.session, openLoadModel.serverId, _progress)
        */
        })
        .expect(specialStatus);

}

module.exports = {
    uploadVideo
};