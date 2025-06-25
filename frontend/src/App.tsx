import React, { useEffect } from "react";
import { PagesRouter } from "./router/PagesRouter";
import { VoiceSocketProvider } from "./contexts/VoiceSocketContext";
import { ServerJournalProvider } from "./contexts/ServerJournalSocketContext";
import { ManagerVisible } from "./components/ActionVisible/ManagerVisible";
import { MediaStreamProvider } from "./contexts/MediaStreamContext";
import { DeviceProvider } from "./contexts/DeviceContext";
import { TransportProvider } from "./contexts/TransportContext";

export const App: React.FC = () => {
    return (
        <>
        <TransportProvider>
            <VoiceSocketProvider>
                <MediaStreamProvider>
                    <DeviceProvider>
                        <ServerJournalProvider>
                            <PagesRouter />
                        </ServerJournalProvider>
                    </DeviceProvider>
                </MediaStreamProvider>
            </VoiceSocketProvider>
        </TransportProvider>
        <ManagerVisible />
        </>
    );
};
