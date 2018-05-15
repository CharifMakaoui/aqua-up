let request = require('supertest');
let urlUtil = require('url');

function getClient(url)  {

    const path = '/api/v1/oauth-clients/local';

    return request(url)
        .get(path)
        .set('Host', urlUtil.parse(url).host)
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
}

module.exports = {
    getClient
};
