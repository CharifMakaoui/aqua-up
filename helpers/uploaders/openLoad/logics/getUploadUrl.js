let request = require('supertest');

async function getUploadUrl(openLoadModel) {
    const path = "/1/file/ul";

    return request(openLoadModel.apiEndpoint)
        .get(path)
        .query({
            login : openLoadModel.apiLogin,
            key : openLoadModel.apiKey,
        })
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/);
}

module.exports = {
    getUploadUrl
};