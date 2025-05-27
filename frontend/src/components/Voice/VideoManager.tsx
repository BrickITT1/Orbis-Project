import React, { useEffect } from "react";

export const VideoManager: React.FC<{videoStreams:Record<string, MediaStream>}> = ({videoStreams}) => {
    useEffect(() => {
        console.log(videoStreams)
    }, [videoStreams]);

    return (
        <>
            <video src="">

            </video>
        </>
    )
}