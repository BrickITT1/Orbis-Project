import React from "react";
//import { PagesRouter } from "./router/PagesRouter";
import { VoiceSocketProvider } from "@/contexts/VoiceSocketContext";
import { ServerJournalProvider } from "@/contexts/ServerJournalSocketContext";
//import { ManagerVisible } from "./components/ActionVisible/ManagerVisible";
import { MediaStreamProvider } from "@/contexts/MediaStreamContext";
import { DeviceProvider } from "@/contexts/DeviceContext";
import { TransportProvider } from "@/contexts/TransportContext";
import { PagesRouter } from "@/routes";
import { ActionManager } from "@/features/action";

export const App: React.FC = () => {
    return (
        <>
        <TransportProvider>
            <VoiceSocketProvider>
                <MediaStreamProvider>
                    <DeviceProvider>
                        <ServerJournalProvider>
                            <div className="bg-custom fixed w-full h-full -z-50 overflow-hidden bg-cover bg-no-repeat"></div>
                            <PagesRouter />
                        </ServerJournalProvider>
                    </DeviceProvider>
                </MediaStreamProvider>
            </VoiceSocketProvider>
        </TransportProvider>
        <ActionManager />
        </>
    );
};
