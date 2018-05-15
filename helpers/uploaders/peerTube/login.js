let request = require('supertest');


function login (url, client, user, expectedStatus = 200) {

    const path = '/api/v1/users/token';

    const body = {
        client_id: client.id,
        client_secret: client.secret,
        username: user.username,
        password: user.password,
        response_type: 'code',
        grant_type: 'password',
        scope: 'upload'
    };

    return request(url)
        .post(path)
        .type('form')
        .send(body)
        .expect(expectedStatus)
}

async function serverLogin (server) {
    const res = await login(server.url, server.client, server.user);
    return res.body.access_token;
}

async function userLogin (server, user, expectedStatus = 200) {
    const res = await login(server.url, server.client, user, expectedStatus);
    return res.body.access_token;
}

module.exports = {
    login,
    userLogin,
    serverLogin
};