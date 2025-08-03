import React from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { setBigMode, setMyPeer, setStatus } from "../../voiceSlices";



export const VoiceManager: React.FC = () => {

    const dispatch = useAppDispatch();
    const activeChat = useAppSelector(state => state.chat.activeChat);
    const activeServer = useAppSelector(s => s.server.activeserver?.id)
    const MyPeer = useAppSelector((s) => s.voice.myPeer);
    const audioOnly = MyPeer.audioOnly;
    const status = useAppSelector(s => s.voice.status)
    const isConnected = (status == 'connected');
    const bigMode = useAppSelector(s => s.voice.bigMode);
    
    const toggleAudioOnly = () => {
        dispatch(setMyPeer({ ...MyPeer, audioOnly: !MyPeer.audioOnly }));
        
    };
    const toggleMute = () => {
        dispatch(setMyPeer({ ...MyPeer, muted: !MyPeer.muted }));
    };
    
    const leaveVoiceRoom = () => {
        dispatch(setStatus('needdisc'))
    }
    return (
        <>
            <div className="flex justify-between gap-5">
                {MyPeer && MyPeer.muted ? <button onClick={ toggleMute }>
                <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M34 20V11.5001C34 5.97722 29.5228 1.50008 24 1.50008C21.6015 1.50008 19.4002 2.3445 17.6771 3.7523M4 24V26.5C4 37.5458 12.9543 46.5 24 46.5C30.1633 46.5 35.6752 43.7122 39.344 39.329M1.5 1.5L46.5 46.5M24 36.5C18.4771 36.5 14 32.023 14 26.5V14.0001L32.2037 32.22C30.3962 34.8075 27.3957 36.5 24 36.5Z" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>

                    </button> : <button onClick={ toggleMute }>
                    <svg width="32" height="32" viewBox="0 0 42 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M41 24V26.5C41 37.5458 32.0458 46.5 21 46.5C9.9543 46.5 1 37.5458 1 26.5V24M21 36.5C15.4771 36.5 11 32.0227 11 26.5V11.5C11 5.97715 15.4771 1.5 21 1.5C26.5227 1.5 31 5.97715 31 11.5V26.5C31 32.0227 26.5227 36.5 21 36.5Z" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                </svg></button>}

                <button onClick={ leaveVoiceRoom }>
                <svg width="40" height="15" viewBox="0 0 52 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M26.001 1C46.9715 1.0013 50.2823 7.6485 50.7243 10.4505C50.8323 10.8648 52.5715 20.0957 45.7465 20.8117C28.766 22.5472 40.4397 10.792 25.9992 11.2385C11.5586 11.685 23.232 22.5473 6.25485 20.8125C-0.571774 20.095 1.16773 10.864 1.27583 10.4532C1.71635 7.6495 5.02895 1.0004 26.001 1Z" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                </button>
                <button onClick={ toggleAudioOnly} disabled={!isConnected}>
                    {audioOnly ? 
                     <svg width="32" height="32" viewBox="0 0 48 47" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <path d="M35.693 16L46 11C46 11 47.25 16 47.25 23.5C47.25 31 46 36 46 36M35.693 16C35.3295 11.7223 34.6925 8.5814 34.0555 7.94445C33.0833 6.97223 26.2777 6 18.5 6M35.693 16C35.8845 18.2515 36 20.818 36 23.5M1 1L46 46M1.56567 13.5C1.22452 16.2492 1 19.7622 1 23.5C1 31.2777 1.97223 38.0833 2.94445 39.0555C3.91668 40.0278 10.7222 41 18.5 41C22.2378 41 25.7508 40.7755 28.5 40.4343" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                 </svg>
                        : 
                       <svg width="32" height="32" viewBox="0 0 48 37" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M35.693 26L46 31C46 31 47.25 26 47.25 18.5C47.25 11 46 6 46 6L35.693 11M35.693 26C35.8845 23.7485 36 21.182 36 18.5C36 15.818 35.8845 13.2515 35.693 11M35.693 26C35.3295 30.2777 34.6925 33.4185 34.0555 34.0555C33.0833 35.0278 26.2777 36 18.5 36C10.7222 36 3.91668 35.0278 2.94445 34.0555C1.97223 33.0833 1 26.2777 1 18.5C1 10.7222 1.97223 3.91668 2.94445 2.94445C3.91668 1.97223 10.7222 1 18.5 1C26.2777 1 33.0833 1.97223 34.0555 2.94445C34.6925 3.5814 35.3295 6.72228 35.693 11" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    }
                </button>
                <button onClick={()=> dispatch(setBigMode(!bigMode))} disabled={!(activeServer || activeChat )}>{bigMode ? <svg width="32" height="32" viewBox="0 0 18 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.45728 1.5L14.3327 14C15.0169 14.6408 15.5619 15.415 15.9348 16.2752C16.3077 17.1352 16.5 18.0625 16.5 19C16.5 19.9375 16.3077 20.8648 15.9348 21.7248C15.5619 22.585 15.0169 23.3592 14.3327 24L1.45728 36.5" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            : <svg width="32" height="32" viewBox="0 0 18 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16.5 36.5L3.62462 24C2.9404 23.3592 2.39535 22.585 2.02245 21.7248C1.64957 20.8648 1.45728 19.9375 1.45728 19C1.45728 18.0625 1.64957 17.1352 2.02245 16.2752C2.39535 15.415 2.9404 14.6408 3.62462 14L16.5 1.5" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                }</button>
            </div>
        </>
    );
};
