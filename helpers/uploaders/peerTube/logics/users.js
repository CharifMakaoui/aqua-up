let request = require('supertest');

function registerUser (peerTubedModel, specialStatus = 204) {
    const path = '/api/v1/users/register';
    const body = {
        username : peerTubedModel.peerUsername,
        password : peerTubedModel.peerPassword,
        email: peerTubedModel.peerUsername + '@gmail.com'
    };

    return request(peerTubedModel.peerServer)
        .post(path)
        .set('Accept', 'application/json')
        .send(body)
        .expect(specialStatus)
}

function getMyUserInformation (peerTubedModel, specialStatus = 200) {
    const path = '/api/v1/users/me';

    return request(peerTubedModel.peerServer)
        .get(path)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + peerTubedModel.peerToken)
        .expect(specialStatus)
        .expect('Content-Type', /json/)
}

function getMyUserVideoQuotaUsed (peerTubedModel, specialStatus = 200) {
    const path = '/api/v1/users/me/video-quota-used';

    return request(peerTubedModel.peerServer)
        .get(path)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + peerTubedModel.peerToken)
        .expect(specialStatus)
        .expect('Content-Type', /json/)
}

module.exports = {
    getMyUserInformation,
    registerUser,
    getMyUserVideoQuotaUsed
};