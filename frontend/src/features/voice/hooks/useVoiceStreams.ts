import { useRef } from "react";

export const useVoiceStreams = () => {
    const audioStreams = useRef<Record<string, MediaStream> | null>(null);
    const videoStreams = useRef<Record<string, MediaStream> | null>(null);

    const setAudioStreams = (audioStream: Record<string, MediaStream>) => {
        audioStreams.current = audioStream;
    };

    const setVideoStreams = (videoStream: Record<string, MediaStream>) => {
        videoStreams.current = videoStream;
    };

    return {
        audioStreams: audioStreams.current,
        videoStreams: videoStreams.current,
        setAudioStreams,
        setVideoStreams,
    };
};
