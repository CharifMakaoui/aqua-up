let request = require('supertest');
let isAbsolute = require('path').isAbsolute;

let peerTubeUsers = require('./users');

function makeGetRequest (options = {}) {
    if (!options.statusCodeExpected) options.statusCodeExpected = 400;

    const req = request(options.url)
        .get(options.path)
        .set('Accept', 'application/json');

    if (options.token) req.set('Authorization', 'Bearer ' + options.token);
    if (options.query) req.query(options.query);

    return req
        .expect('Content-Type', /json/)
        .expect(options.statusCodeExpected)
}


function buildAbsoluteFixturePath (path) {
    if (isAbsolute(path)) {
        return path
    }

    return join(__dirname, '..', '..', 'api', 'fixtures', path)
}

function searchVideo (url, search) {
    const path = '/api/v1/videos';
    const req = request(url)
        .get(path + '/search')
        .query({ search })
        .set('Accept', 'application/json');

    return req.expect(200)
        .expect('Content-Type', /json/)
}

async function uploadVideo(url, accessToken, videoAttributesArg, specialStatus = 200) {
    const path = '/api/v1/videos/upload';
    let defaultChannelId = '1';

    try {
        const res = await peerTubeUsers.getMyUserInformation(url, accessToken);
        defaultChannelId = res.body.videoChannels[0].id
    } catch (e) { /* empty */ }

    // Override default attributes
    const attributes = Object.assign({
        name: 'my super video',
        category: 5,
        licence: 4,
        language: 'zh',
        channelId: defaultChannelId,
        nsfw: true,
        description: 'my super description',
        support: 'my super support text',
        tags: [ 'tag' ],
        privacy: 1,
        commentsEnabled: true,
        fixture: 'video_short.webm'
    }, videoAttributesArg);

    const req = request(url)
        .post(path)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + accessToken)
        .field('name', attributes.name)
        .field('nsfw', JSON.stringify(attributes.nsfw))
        .field('commentsEnabled', JSON.stringify(attributes.commentsEnabled))
        .field('privacy', attributes.privacy.toString())
        .field('channelId', attributes.channelId);

    if (attributes.description !== undefined) {
        req.field('description', attributes.description)
    }
    if (attributes.language !== undefined) {
        req.field('language', attributes.language.toString())
    }
    if (attributes.category !== undefined) {
        req.field('category', attributes.category.toString())
    }
    if (attributes.licence !== undefined) {
        req.field('licence', attributes.licence.toString())
    }

    for (let i = 0; i < attributes.tags.length; i++) {
        req.field('tags[' + i + ']', attributes.tags[i])
    }

    if (attributes.thumbnailfile !== undefined) {
        req.attach('thumbnailfile', buildAbsoluteFixturePath(attributes.thumbnailfile))
    }
    if (attributes.previewfile !== undefined) {
        req.attach('previewfile', buildAbsoluteFixturePath(attributes.previewfile))
    }

    return req.attach('videofile', buildAbsoluteFixturePath(attributes.fixture))
        .expect(specialStatus)

}

function getVideoCategories (url) {
    const path = '/api/v1/videos/categories';

    return makeGetRequest({
        url,
        path,
        statusCodeExpected: 200
    })
}

module.exports = {
    uploadVideo,
    searchVideo,
    getVideoCategories
};