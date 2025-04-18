import React, { useState } from 'react';
import { useLogoutUserMutation } from '../services/auth';
import { useNavigate } from 'react-router-dom';
import { useGetServersQuery } from '../services/server';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setActiveServer } from '../features/server/serverSlices';
import { setActiveChat } from '../features/chat/chatSlices';

export const AppMenu: React.FC = () =>  {
    const [avatarUrl, setAvatarUrl] = useState<string>();
    const [logout] = useLogoutUserMutation();
    const {} = useGetServersQuery({});
    const dispatch = useAppDispatch();
    const navigator = useNavigate();
    const server = useAppSelector((state) => state.server);
    
    //console.log(server)    
    return ( 
        <>
            <div className="app-menu">
                <div className="avatar avatar-null">
                    {avatarUrl ? null : (
                        <>
                            <img src="/img/icon.png" alt="" />
                        </>
                    )}
                </div>
                <div className="button-items">
                    <div className="button-item">
                        <button onClick={()=> {
                            navigator('/app')
                        }}>LS</button>
                    </div>
                    {/* <div className="button-item">
                        <button>
                            <svg width="39" height="40" viewBox="0 0 39 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M32.2102 30.1575V26.8025C32.2102 25.9717 32.532 25.175 33.1047 24.5875L35.418 22.215C36.6107 20.9917 36.6107 19.0083 35.418 17.785L33.1047 15.4125C32.532 14.825 32.2102 14.0283 32.2102 13.1975V9.83997C32.2102 8.10995 30.8427 6.70747 29.156 6.70747H25.8825C25.0725 6.70747 24.2955 6.37742 23.7227 5.78997L21.4095 3.41748C20.2167 2.19417 18.283 2.19417 17.0902 3.41748L14.7772 5.78997C14.2044 6.37742 13.4275 6.70747 12.6175 6.70747H9.34397C8.53352 6.70747 7.75632 7.03785 7.18347 7.62585C6.61062 8.21385 6.28914 9.01125 6.28979 9.84247V13.1975C6.28977 14.0283 5.96799 14.825 5.39522 15.4125L3.08204 17.785C1.88932 19.0083 1.88932 20.9917 3.08204 22.215L5.39522 24.5875C5.96799 25.175 6.28977 25.9717 6.28979 26.8025V30.1575C6.28979 31.8875 7.65719 33.29 9.34397 33.29H12.6175C13.4275 33.29 14.2044 33.62 14.7772 34.2075L17.0902 36.58C18.283 37.8032 20.2167 37.8032 21.4095 36.58L23.7227 34.2075C24.2955 33.62 25.0725 33.29 25.8825 33.29H29.1535C29.964 33.2907 30.7415 32.961 31.3147 32.3733C31.888 31.7858 32.2102 30.9887 32.2102 30.1575Z" stroke="#5788EB" strokeWidth="3.75" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                    </div> */}
                    {server.servers && server.servers.map((val, index) => (
                        <div className="button-item" key={`server-${index}`}>
                            <button onClick={async()=> {
                                await dispatch(setActiveServer(val));
                                
                                navigator('/app/server')
                                
                            }}>{val.id}</button>
                        </div>
                    ))}
                </div>
                <div className="exit">
                    <button onClick={async()=>{
                        try {
                            await logout({}).unwrap();
                        } catch(err) {
                            console.log(err)
                        }
                    }}>
                        <svg width="37" height="37" viewBox="0 0 37 37" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18.5 12.3125L12.3125 18.5M12.3125 18.5L18.5 24.6875M12.3125 18.5H35M35 28.301V28.3996C35 30.7098 35 31.8658 34.5504 32.7482C34.1549 33.5243 33.5243 34.1549 32.7482 34.5504C31.8658 35 30.7098 35 28.3996 35H8.59959C6.28938 35 5.13582 35 4.25349 34.5504C3.47737 34.1549 2.84459 33.5243 2.44921 32.7482C2 31.8666 2 30.7121 2 28.4064V8.59257C2 6.28691 2 5.13397 2.44921 4.25246C2.84459 3.47634 3.47737 2.84459 4.25349 2.44921C5.135 2 6.28794 2 8.59361 2H28.4064C30.7121 2 31.8666 2 32.7482 2.44921C33.5243 2.84459 34.1549 3.47696 34.5504 4.25307C35 5.13541 35 6.2898 35 8.6V8.70312" stroke="#5788EB" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        </> 
    );
}