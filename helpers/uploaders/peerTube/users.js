let request = require('supertest');

function registerUser (url, username, password, specialStatus = 204) {
    const path = '/api/v1/users/register';
    const body = {
        username,
        password,
        email: username + '@example.com'
    };

    return request(url)
        .post(path)
        .set('Accept', 'application/json')
        .send(body)
        .expect(specialStatus)
}

function getMyUserInformation (url, accessToken, specialStatus = 200) {
    const path = '/api/v1/users/me';

    return request(url)
        .get(path)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + accessToken)
        .expect(specialStatus)
        .expect('Content-Type', /json/)
}

function getMyUserVideoQuotaUsed (url, accessToken, specialStatus = 200) {
    const path = '/api/v1/users/me/video-quota-used';

    return request(url)
        .get(path)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + accessToken)
        .expect(specialStatus)
        .expect('Content-Type', /json/)
}

module.exports = {
    getMyUserInformation,
    registerUser,
    getMyUserVideoQuotaUsed
};