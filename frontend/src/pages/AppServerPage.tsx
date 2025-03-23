import React from 'react';
import '../styles/pages/app.scss'
import '../styles/pages/appserver.scss'
import { AppMenu } from '../components/AppMenu';
import { MessageMenu } from '../components/MessagesMenu';
import { Action } from '../components/Action';
import { Member } from '../components/Member';
import { MessageMenuServer } from '../components/ServerMessagesMenu';

export const AppServerPage: React.FC = () =>  {
    
    return ( 
        <>
            <div className="main-app">
                <AppMenu />
                <MessageMenuServer />
                <Action />
                <Member />
            </div>
        </> 
    );
}