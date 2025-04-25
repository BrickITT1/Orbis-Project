
import React, { useEffect } from 'react';
import { PagesRouter } from "./router/PagesRouter";
import { VoiceSocketProvider } from './contexts/VoiceSocketContext';

export const App: React.FC = () =>  {
    
    
    return ( 
        <>
        <VoiceSocketProvider>
            <PagesRouter />
            </VoiceSocketProvider>
        </>
    );
}