import React, { useState } from "react";
import AccountSettings from "../components/Settings/AccountSettings";
import ProfileSettings from "../components/Settings/ProfileSettings";
import DevicesSettings from "../components/Settings/DevicesSettings";
import AppearanceSettings from "../components/Settings/AppearanceSettings";
import VoiceAndVideoSettings from "../components/Settings/VoiceAndVideoSettings";
import ChatSettings from "../components/Settings/ChatSettings";
import NotificationSettings from "../components/Settings/NotificationSettings";
import HotKeySettings from "../components/Settings/HotKeySettings";
import LanguageSettings from "../components/Settings/LanguageSettings";
import { useLogoutUserMutation } from "../services/auth";

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
    return (
        <>
            <div className="main-app settings-app">
                <div className="settings-container">
                    <ul className="settings-menu">
                        
                        <div className="cont">
                            <div className="search">
                            <input type="text" placeholder="Search"/>
                        </div>
                             {settingsOptions.map(option => (
                            <button
                                key={option}
                                onClick={() => setCurrentSettingsPage(option)}
                                className={currentSettingsPage === option ? "active" : ""}
                            >
                                {option}
                            </button>
                        ))}
                        </div>
                        <div className="action">
                            <button onClick={async () => {
                            try {
                                await logout({}).unwrap();
                            } catch (err) {
                                console.log(err);
                            }
                        }}
                    >Exit</button>
                        </div>
                    </ul>
                    <div className="settings-actions">
                        <h2>{currentSettingsPage}</h2>
                        <div className="settings-content">
                            {SettingsContent[currentSettingsPage]}
                    </div>
                </div>
                </div>
            </div>
        </>
    )
}