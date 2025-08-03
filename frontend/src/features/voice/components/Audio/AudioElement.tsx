// src/components/AudioElement.tsx
import React, { useEffect, useRef } from "react";

interface AudioElementProps {
    stream: MediaStream;
    streamId: string;
    onError: (err: Error) => void;
    onEnded: () => void;
}

const AudioElement: React.FC<AudioElementProps> = ({
    stream,
    streamId,
    onError,
    onEnded,
}) => {
    const ref = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const audio = ref.current;
        if (!audio) return;
        // Устанавливаем новый поток
        audio.srcObject = stream;
        audio.play().catch(onError);

        return () => {
            // Останавливаем все треки и сбрасываем источник при размонтировании
            if (audio.srcObject) {
                (audio.srcObject as MediaStream)
                    .getTracks()
                    .forEach((t) => t.stop());
                audio.srcObject = null;
            }
        };
    }, [stream, onError]);

    return (
        <audio
            ref={ref}
            autoPlay
            playsInline
            onEnded={onEnded}
            onError={() =>
                onError(new Error(`Playback error on stream ${streamId}`))
            }
        />
    );
};

export default AudioElement;
