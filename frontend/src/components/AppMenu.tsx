import React, { useEffect, useState } from "react";
import { useLogoutUserMutation } from "../services/auth";
import { useNavigate } from "react-router-dom";
import { useGetServersQuery } from "../services/server";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { initCreateServer, setActiveServer } from "../features/server/serverSlices";
import { setActiveChat } from "../features/chat/chatSlices";
import { ModalLayout } from "./Layouts/Modal/Modal";
import { useServerJournalContext } from "../contexts/ServerJournalSocketContext";

export const AppMenu: React.FC = () => {
    const [avatarUrl, setAvatarUrl] = useState<string>();
    const [logout] = useLogoutUserMutation();
    const {} = useGetServersQuery({});
    const dispatch = useAppDispatch();
    const navigator = useNavigate();
    const server = useAppSelector((state) => state.server);
    const {socket} = useServerJournalContext();

    useEffect(()=> {
        dispatch(setActiveChat(undefined))
    }, [server.activeserver])
    
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
                        <button
                            onClick={() => {
                                dispatch(setActiveServer(undefined));
                            }}
                        >
                            LS
                        </button>
                    </div>
                    {/* <div className="button-item">
                        <button>
                            <svg width="39" height="40" viewBox="0 0 39 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M32.2102 30.1575V26.8025C32.2102 25.9717 32.532 25.175 33.1047 24.5875L35.418 22.215C36.6107 20.9917 36.6107 19.0083 35.418 17.785L33.1047 15.4125C32.532 14.825 32.2102 14.0283 32.2102 13.1975V9.83997C32.2102 8.10995 30.8427 6.70747 29.156 6.70747H25.8825C25.0725 6.70747 24.2955 6.37742 23.7227 5.78997L21.4095 3.41748C20.2167 2.19417 18.283 2.19417 17.0902 3.41748L14.7772 5.78997C14.2044 6.37742 13.4275 6.70747 12.6175 6.70747H9.34397C8.53352 6.70747 7.75632 7.03785 7.18347 7.62585C6.61062 8.21385 6.28914 9.01125 6.28979 9.84247V13.1975C6.28977 14.0283 5.96799 14.825 5.39522 15.4125L3.08204 17.785C1.88932 19.0083 1.88932 20.9917 3.08204 22.215L5.39522 24.5875C5.96799 25.175 6.28977 25.9717 6.28979 26.8025V30.1575C6.28979 31.8875 7.65719 33.29 9.34397 33.29H12.6175C13.4275 33.29 14.2044 33.62 14.7772 34.2075L17.0902 36.58C18.283 37.8032 20.2167 37.8032 21.4095 36.58L23.7227 34.2075C24.2955 33.62 25.0725 33.29 25.8825 33.29H29.1535C29.964 33.2907 30.7415 32.961 31.3147 32.3733C31.888 31.7858 32.2102 30.9887 32.2102 30.1575Z" stroke="#5788EB" strokeWidth="3.75" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                    </div> */}
                    {server.servers &&
                        server.servers.map((val, index) => (
                            <div
                                className="button-item server-button"
                                key={`server-${val.id}`}
                            >
                                <button
                                    onClick={async() => {
                                        if (server.activeserver?.id == val.id) return;
                                        socket?.emit('leave-server', server.activeserver?.id);
                                        dispatch(setActiveServer(val));
                                        
                                        socket?.emit('join-server', val.id)
                                    }}
                                >
                                    {val.name}
                                </button>
                            </div>
                        ))}
                </div>
                <div className="manage-app">

                    <div className="exit add-server">
                        <button onClick={() => {
                            dispatch(initCreateServer());
                        }}>
                            <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M28.125 22.5H22.5M22.5 22.5H16.875M22.5 22.5V16.875M22.5 22.5V28.125" stroke="#FFF" strokeWidth="1.25" strokeLinecap="round"/>
                                <path d="M13.125 6.25841C15.8829 4.66307 19.0849 3.75 22.5 3.75C32.8552 3.75 41.25 12.1447 41.25 22.5C41.25 32.8552 32.8552 41.25 22.5 41.25C12.1447 41.25 3.75 32.8552 3.75 22.5C3.75 19.0849 4.66307 15.8829 6.25841 13.125" stroke="#FFF" strokeWidth="1.25" strokeLinecap="round"/>
                            </svg>
                        </button>
                    </div>
                    
                    <div className="exit settings">
                        <button className="" onClick={() => {
                            navigator("/app/settings")
                        }}>
                            <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14.7058 37.8711C18.5096 40.1237 20.4116 41.25 22.5 41.25C24.5884 41.25 26.4904 40.1237 30.2942 37.8711L31.5808 37.1091C35.3846 34.8564 37.2866 33.7301 38.3308 31.875C39.375 30.0199 39.375 27.7672 39.375 23.2618M39.0276 15C38.8736 14.3017 38.6514 13.6946 38.3308 13.125C37.2866 11.2698 35.3846 10.1435 31.5808 7.89086L30.2942 7.12896C26.4904 4.87631 24.5884 3.75 22.5 3.75C20.4116 3.75 18.5096 4.87631 14.7058 7.12896L13.4192 7.89086C9.61538 10.1435 7.71345 11.2698 6.66923 13.125C5.625 14.9802 5.625 17.2328 5.625 21.7382V23.2618C5.625 27.7672 5.625 30.0199 6.66923 31.875C7.09361 32.6289 7.65967 33.2625 8.4375 33.9004" stroke="#FFF" strokeWidth="1.25" strokeLinecap="round"/>
                                <path d="M22.5 28.125C25.6066 28.125 28.125 25.6066 28.125 22.5C28.125 19.3934 25.6066 16.875 22.5 16.875C19.3934 16.875 16.875 19.3934 16.875 22.5C16.875 25.6066 19.3934 28.125 22.5 28.125Z" stroke="#FFF" strokeWidth="1.25"/>
                            </svg>

                        </button>
                    </div>

                    <div className="exit">
                    <button
                        onClick={async () => {
                            try {
                                await logout({}).unwrap();
                            } catch (err) {
                                console.log(err);
                            }
                        }}
                    >
                        <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16.875 8.4375H15C10.5806 8.4375 8.37088 8.4375 6.99793 9.81043C5.625 11.1834 5.625 13.3931 5.625 17.8125V18.75M16.875 36.5625H15C10.5806 36.5625 8.37088 36.5625 6.99793 35.1896C5.625 33.8166 5.625 31.6069 5.625 27.1875V26.25" stroke="#FFF" strokeWidth="1.25" strokeLinecap="round"/>
                            <path d="M25.608 4.40129C21.5541 3.69423 19.5272 3.3407 18.2011 4.5163C16.875 5.69191 16.875 7.84235 16.875 12.1432V32.8567C16.875 37.1576 16.875 39.3081 18.2011 40.4837C19.5272 41.6593 21.5541 41.3057 25.608 40.5986L29.9745 39.8372C34.4642 39.054 36.7089 38.6625 38.0421 37.0157C39.375 35.3691 39.375 32.9874 39.375 28.2242V16.7758C39.375 12.0126 39.375 9.63097 38.0421 7.98423C37.1513 6.88373 35.8532 6.34383 33.75 5.87302" stroke="#FFF" strokeWidth="1.25" strokeLinecap="round"/>
                            <path d="M22.5 20.625V24.375" stroke="#FFF" strokeWidth="1.25" strokeLinecap="round"/>
                        </svg>


                    </button>
                </div>
                </div>
                
            </div>
        </>
    );
};
