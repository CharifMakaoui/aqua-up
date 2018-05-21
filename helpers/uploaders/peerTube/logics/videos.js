let request = require('supertest');
let isAbsolute = require('path').isAbsolute;

let fireBaseDatabase = require('../../../firebase/firebaseDatabase');

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

function searchVideo (peerTubedModel, search) {
    const path = '/api/v1/videos';
    const req = request(peerTubedModel.peerServer)
        .get(path + '/search')
        .query({ search })
        .set('Accept', 'application/json');

    return req.expect(200)
        .expect('Content-Type', /json/)
}

function getVideoCategories (peerTubedModel) {
    const path = '/api/v1/videos/categories';

    return makeGetRequest({
        url: peerTubedModel.peerServer,
        path : path,
        statusCodeExpected: 200
    })
}

async function getVideo (peerTubedModel, id, expectedStatus = 200) {
    const path = '/api/v1/videos/' + id;

    return request(peerTubedModel.peerServer)
        .get(path)
        .set('Accept', 'application/json')
        .expect(expectedStatus)
}

async function uploadVideo(peerTubedModel, videoAttributesArg, specialStatus = 200) {
    const path = '/api/v1/videos/upload';
    let defaultChannelId = '1';

    try {
        const res = await peerTubeUsers.getMyUserInformation(peerTubedModel);
        defaultChannelId = res.body.videoChannels[0].id
    } catch (e) { /* empty */ }

    // Override default attributes
    const attributes = Object.assign({
        name: 'my super video',
        category: 5,
        licence: 4,
        language: 'zh',
        channelId: defaultChannelId,
        nsfw: "true",
        description: 'my super description',
        support: 'my super support text',
        tags: [ 'tag' ],
        privacy: 3,
        commentsEnabled: "true",
        fixture: 'video_short.webm'
    }, videoAttributesArg);

    console.log("peertube video attributes ==> ", attributes);

    const req = request(peerTubedModel.peerServer)
        .post(path)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + peerTubedModel.peerToken)
        .field('name', attributes.name)
        .field('nsfw', attributes.nsfw)
        .field('commentsEnabled', attributes.commentsEnabled)
        .field('privacy', attributes.privacy)
        .field('channelId', attributes.channelId);

    if (attributes.description !== undefined) {
        req.field('description', attributes.description)
    }
    if (attributes.language !== undefined) {
        req.field('language', attributes.language)
    }
    if (attributes.category !== undefined) {
        req.field('category', attributes.category)
    }
    if (attributes.licence !== undefined) {
        req.field('licence', attributes.licence)
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

    console.log('Start Upload (peertube) ...');
    return req.attach('videofile', buildAbsoluteFixturePath(attributes.fixture))
        .on('progress', async function(e) {
            let _progress = (100.0 * e.loaded / e.total).toFixed(0);
            console.log(`peertube server : ${peerTubedModel.serverId} upload progress : ` , _progress);
            /*if(_progress % 2 === 0)
                await fireBaseDatabase
                    .uploadProgress(uploadModel.sessionInfo.session, peerTubedModel.serverId, _progress)*/
        })
        .expect(specialStatus);
}

module.exports = {
    uploadVideo,
    searchVideo,
    getVideo,
    getVideoCategories
};