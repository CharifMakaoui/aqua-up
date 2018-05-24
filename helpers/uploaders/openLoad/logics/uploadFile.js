let request = require('supertest');
let url = require('url');

async function openLoadUploadFile(uploadModel, openLoadModel, specialStatus = 200) {

    let options = {
        host: url.parse(openLoadModel.uploadUrl).host,
        path: url.parse(openLoadModel.uploadUrl).pathname
    };

    return request(options.host)
        .post(options.path)
        .set('Accept', 'application/json')
        .attach('file1', uploadModel.filePath)
        .on('progress', async function (e) {
            let _progress = (100.0 * e.loaded / e.total).toFixed(0);
            console.log(`openload server : ${openLoadModel.serverId} upload progress : ` , _progress);
            /*if(_progress % 2 === 0)
                await fireBaseDatabase.uploadProgress(uploadModel.sessionInfo.session, openLoadModel.serverId, _progress)
        */})
        .expect(specialStatus);

}

module.exports = {
    openLoadUploadFile
};