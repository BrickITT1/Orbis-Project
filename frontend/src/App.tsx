import React, { useEffect } from "react";
import { PagesRouter } from "./router/PagesRouter";
import { VoiceSocketProvider } from "./contexts/VoiceSocketContext";
import { ServerJournalProvider } from "./contexts/ServerJournalSocketContext";
import { ManagerVisible } from "./components/ActionVisible/ManagerVisible";
import { MediaStreamProvider } from "./contexts/MediaStreamContext";

export const App: React.FC = () => {
    return (
        <>
            <VoiceSocketProvider>
                 <MediaStreamProvider>
                <ServerJournalProvider>
                    <PagesRouter />
                </ServerJournalProvider>
                </MediaStreamProvider>
            </VoiceSocketProvider>
            <ManagerVisible />
        </>
    );
};
