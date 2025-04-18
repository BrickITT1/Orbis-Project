import React, { useEffect } from 'react';
import '../styles/pages/app.scss'
import { AppMenu } from '../components/AppMenu';
import { MessageMenu } from '../components/MessagesMenu';
import { Action } from '../components/Action';
import { Member } from '../components/Member';
import { setActiveServer } from '../features/server/serverSlices';
import { useAppDispatch } from '../app/hooks';

export const AppPage: React.FC = () =>  {
    const dispatch = useAppDispatch()
    useEffect(()=> {
        dispatch(setActiveServer(undefined))
    })
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