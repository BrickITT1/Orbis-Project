import React from 'react';
import '../styles/pages/app.scss'
import { AppMenu } from '../components/AppMenu';
import { MessageMenu } from '../components/MessagesMenu';
import { Action } from '../components/Action';
import { Member } from '../components/Member';

export const AppPage: React.FC = () =>  {
    
    return ( 
        <>
            <div className="main-app">
                <AppMenu />
                <MessageMenu />
                <Action />
                <Member />
            </div>
        </> 
    );
}