import { DefaultButton } from "@/components/ui/Button/DefaultButton";
import { ModalInput } from "@/components/ui/Input/ModalInput";
import { useLogoutUserMutation } from "@/features/auth";
import { AccountSettings, AppearanceSettings, ChatSettings, DevicesSettings, HotKeySettings, LanguageSettings, NotificationSettings, ProfileSettings, VoiceAndVideoSettings } from "@/features/usersettings";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SettingsContent: Record<string, JSX.Element> = {
    Account: <AccountSettings />,
    Profile: <ProfileSettings />,
    Devices: <DevicesSettings />,
    Appearance: <AppearanceSettings />,
    "Voice and video": <VoiceAndVideoSettings />,
    Chat: <ChatSettings />,
    Notification: <NotificationSettings />,
    "Hot Key": <HotKeySettings />,
    Language: <LanguageSettings />
};

const settingsOptions = Object.keys(SettingsContent);

export const SettingAppPage: React.FC = () => {
    const [currentSettingsPage, setCurrentSettingsPage] = useState<string>("Account");
    const [logout] = useLogoutUserMutation();
    const navigate = useNavigate();
    return (
        <>
            <div className="w-screen h-screen text-white overflow-hidden">
                <div className="grid grid-cols-[1fr_5fr] h-full w-full">
                    <ul className="w-full ">
                        
                        <div className="cont flex flex-col bg-[rgba(86,82,209,0.5)] p-10 gap-5 h-full relative justify-between">
                            <div className="flex flex-col">
                             <div className="">
                                <DefaultButton handler={ () => {navigate('/app')}}
                                >Back</DefaultButton>
                            </div>
                            <div className="search">
                                <ModalInput placeHolder="Search" change={()=>{}}/>
                            </div>
                             {settingsOptions.map(option => (
                                <div className="p-5">
                                <button
                                    key={option}
                                    onClick={() => setCurrentSettingsPage(option)}
                                    className={currentSettingsPage === option ? " brightness-125 text-left" : "text-left"}
                                >
                                    {option}
                                </button>
                                </div>
                                ))}
                                </div>
                            <div className="p-5">
                                <button onClick={async () => {
                                try {
                                    await logout({}).unwrap();
                                } catch (err) {
                                    console.log(err);
                                }
                            }}
                        >Exit</button>
                        
                            </div>
                        </div>
                       
                    </ul>
                    <div className="h-full bg-[#2e3ed328]">
                        <h1 className="p-5 border-b border-b-[#ffffff52]">{currentSettingsPage}</h1>
                        <div className="p-5">
                            {SettingsContent[currentSettingsPage]}
                        </div>
                </div>
                </div>
            </div>
        </>
    )
}