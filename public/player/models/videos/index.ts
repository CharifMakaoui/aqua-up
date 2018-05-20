export interface VideoConstant <T> {
    id: T
    label: string
}

export interface VideoFile {
    magnetUri: string
    resolution: VideoConstant<VideoResolution>
    size: number // Bytes
    torrentUrl: string
    fileUrl: string
}

export enum VideoResolution {
    H_240P = 240,
    H_360P = 360,
    H_480P = 480,
    H_720P = 720,
    H_1080P = 1080
}