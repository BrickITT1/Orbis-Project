import React from "react";
import { SettingsButton } from "../ui/Button";
import { useAppSelector } from "@/app/hooks";

const ProfileSettings: React.FC = () => {
    const user = useAppSelector(s => s.auth.user?.info);
    return (
        <div className="flex">
            <div className="flex flex-col gap-2 border-1 border-[#ffffff11] p-2 w-fit justify-between">
                <div className="">
                    display name
                </div>
                <input type="text" className="w-full box-border" value={user?.username}/>
                <SettingsButton handler={()=>{}}>Change</SettingsButton>
            
            </div>
            <div className="flex flex-col gap-2 border-1 border-[#ffffff11] p-2 w-fit">
                <div className="">
                    Avatar
                </div>
                <div className="">
                    current
                    <img src={user?.avatar_url} alt="" />
                </div>
                
                <SettingsButton handler={()=>{}}>Change</SettingsButton>
            
            </div>
            <div className="flex flex-col gap-2 border-1 border-[#ffffff11] p-2 w-fit justify-between">
                <div className="">
                    About me
                </div>
                <textarea className="border-b-1 contain-size"></textarea>
                <SettingsButton handler={()=>{}}>Change</SettingsButton>
            
            </div>
            
            
        </div>
    );
};

export default ProfileSettings;
