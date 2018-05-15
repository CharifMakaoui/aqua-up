"use strict";

let access = require('fs').access;
let constants = require('fs').constants;
let createWriteStream = require('fs').createWriteStream;
let isAbsolute = require('path').isAbsolute;
let promisify = require('util').promisify;
let Bluebird = require('bluebird');
let request = require('request');

let peerTubeClient = require('./peerTube/getClient');
let peerTubeLogin = require('./peerTube/login');
let peerVideos = require('./peerTube/videos');

let youtubeDL = require('youtube-dl');


const accessPromise = promisify(access);

const processOptions = {
    cwd: __dirname,
    maxBuffer: Infinity
};


async function getAccessToken(url, username, password) {

    const res = await peerTubeClient.getClient(url);
    const client = {
        id: res.body.client_id,
        secret: res.body.client_secret
    };

    const user = {
        username: username,
        password: password
    };

    const res2 = await peerTubeLogin.login(url, client, user);
    const accessToken = res2.body.access_token;

    console.log(accessToken);

    return accessToken;
}

function processVideo(url, accesstoken, info, languageCode) {
    return new Promise(async res => {
        console.log('Fetching object.', info);

        const videoInfo = await fetchObject(info);
        console.log('Fetched object.', videoInfo);

        const result = await peerVideos.searchVideo(url, videoInfo.title);

        console.log('############################################################\n');

        if (result.body.data.find(v => v.name === videoInfo.title)) {
            console.log('Video "%s" already exists, don\'t reupload it.\n', videoInfo.title);
            return res()
        }

        const path = join(__dirname, new Date().getTime() + '.mp4');

        console.log('Downloading video "%s"...', videoInfo.title);

        const options = ['-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best', '-o', path];
        try {
            youtubeDL.exec(videoInfo.url, options, processOptions, async (err, output) => {
                if (err) {
                    console.error(err);
                    return res()
                }

                console.log(output.join('\n'));
                await uploadVideoOnPeerTube(url, accesstoken, normalizeObject(videoInfo), path, languageCode);
                return res()
            })
        } catch (err) {
            console.log(err.message);
            return res()
        }
    })
}

async function uploadVideoOnPeerTube(url, accesstoken, videoInfo, videoPath, language) {
    const category = await getCategory(videoInfo.categories);
    const licence = getLicence(videoInfo.license);
    let tags = []
    if (Array.isArray(videoInfo.tags)) {
        tags = videoInfo.tags
            .filter(t => t.length < 30 && t.length > 2)
            .map(t => t.normalize())
            .slice(0, 5)
    }

    let thumbnailfile;
    if (videoInfo.thumbnail) {
        thumbnailfile = join(__dirname, 'thumbnail.jpg');

        await doRequestAndSaveToFile({
            method: 'GET',
            uri: videoInfo.thumbnail
        }, thumbnailfile)
    }

    const videoAttributes = {
        name: truncate(videoInfo.title, {
            'length': CONSTRAINTS_FIELDS.VIDEOS.NAME.max,
            'separator': /,? +/,
            'omission': ' […]'
        }),
        category,
        licence,
        language,
        nsfw: isNSFW(videoInfo),
        commentsEnabled: true,
        description: videoInfo.description || undefined,
        support: undefined,
        tags,
        privacy: 1,
        fixture: videoPath,
        thumbnailfile,
        previewfile: thumbnailfile
    }

    console.log('\nUploading on PeerTube video "%s".', videoAttributes.name)
    try {
        await peerVideos.uploadVideo(url, accesstoken, videoAttributes)
    } catch (err) {
        console.log(err.message);
        return err;
    }

    /*await unlinkPromise(videoPath)
    if (thumbnailfile) {
        await unlinkPromise(thumbnailfile)
    }*/

    console.log('Uploaded video "%s"!\n', videoAttributes.name)
}

function normalizeObject(obj) {
    const newObj = {}

    for (const key of Object.keys(obj)) {
        // Deprecated key
        if (key === 'resolution') continue

        const value = obj[key]

        if (typeof value === 'string') {
            newObj[key] = value.normalize()
        } else {
            newObj[key] = value
        }
    }

    return newObj
}

function doRequestAndSaveToFile(requestOptions, destPath) {
    return new Bluebird((res, rej) => {
        const file = createWriteStream(destPath)
        file.on('finish', () => res())

        request(requestOptions)
            .on('error', err => rej(err))
            .pipe(file)
    })
}

function fetchObject(info) {
    const url = buildUrl(info)

    return new Promise < any > (async (res, rej) => {
        youtubeDL.getInfo(url, undefined, processOptions, async (err, videoInfo) => {
            if (err) return rej(err);

            const videoInfoWithUrl = Object.assign(videoInfo, {url});
            return res(normalizeObject(videoInfoWithUrl))
        })
    })
}

async function getCategory(categories) {
    if (!categories) return undefined;

    const categoryString = categories[0];

    if (categoryString === 'News & Politics') return 11;

    const res = await getVideoCategories(program['url']);
    const categoriesServer = res.body;

    for (const key of Object.keys(categoriesServer)) {
        const categoryServer = categoriesServer[key];
        if (categoryString.toLowerCase() === categoryServer.toLowerCase()) return parseInt(key, 10)
    }

    return undefined
}

function getLicence(licence) {
    if (!licence) return undefined;

    if (licence.indexOf('Creative Commons Attribution licence') !== -1) return 1;

    return undefined
}

function buildUrl(info) {
    const webpageUrl = info.webpage_url as string;
    if (webpageUrl && webpageUrl.match(/^https?:\/\//)) return webpageUrl;

    const url = info.url as string;
    if (url && url.match(/^https?:\/\//)) return url;

    // It seems youtube-dl does not return the video url
    return info.id
}

function isNSFW(info) {
    return !!(info.age_limit && info.age_limit >= 16);
}

async function upload(url, accessToken, $file, fileName, description) {
    await accessPromise($file, constants.F_OK)
    console.log('Uploading %s video...', fileName);

    const videoAttributes = {
        name: fileName,
        description: description,
        tags: ['aquascreen', 'movie'],
        fixture: $file
    };

    await peerVideos.uploadVideo(url, accessToken, videoAttributes);

    console.log(`Video ${fileName} uploaded.`);

}

module.exports = {
    getAccessToken,
    upload,
    processVideo
};
