let request = require('supertest');
let urlUtil = require('url');

function getClient(peerTubedModel)  {

    const path = '/api/v1/oauth-clients/local';

    return request(peerTubedModel.peerServer)
        .get(path)
        .set('Host', urlUtil.parse(peerTubedModel.peerServer).host)
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
}

module.exports = {
    getClient
};
