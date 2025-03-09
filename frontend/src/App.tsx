
import React, { useEffect } from 'react';
import { PagesRouter } from "./router/PagesRouter";
import { useRefreshTokenMutation } from './services/auth';

export const App: React.FC = () =>  {
    
    
    return ( 
        <>
            
                <PagesRouter />
        </>
    );
}