let workerQueue = {
    session: null,
    videoUrl: null,
    type: null,
    movie_name: null,
    duration: null,
    quality: null,
    callback_webhook: null,
    servers: [
        {
            id: null,
            server_name: null,
            access_type: null,
            credential: {
                server_original: null,
                api_secret: null,
                api_endpoint: null,
                api_key: null
            }
        }
    ]
};

let uploadModel = {
    filePath: null,
    homeDir: null,
    uploadDir: null,
    videoInfo: {
        fulltitle : null,
        thumbnail : null,
    },
    sessionInfo: workerQueue,
};

let videoInfo = {
    is_torrent : false,
    torrent_magnet : "",
    torrent_hash : "",
    video_quality : 720,
    status : "working",
    belong : "movie",
    server_id : 0,
    parent_id : 0,
    file_url : "",
    file_id : "",
    upload_id : "",
    video_hash : "",
    video_bytes_size : ""
};

let peerTubeModel = {
    peerServer: null,
    peerUsername: null,
    peerPassword: null,
    peerToken: null,
};

module.exports = {
    workerQueue,
    uploadModel,
    videoInfo,
    peerTubeModel
};