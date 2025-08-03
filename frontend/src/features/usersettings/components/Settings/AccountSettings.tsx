import { useAppSelector } from "@/app/hooks";
import React from "react";
import { SettingsButton } from "../ui/Button";

const AccountSettings: React.FC = () => {
    const user = useAppSelector(s => s.auth.user?.info);
    return (
        <div className="flex">
            <div className="flex flex-col gap-2 border-1 border-[#ffffff11] p-2 w-fit">
                <div className="">
                User name:
                </div>
                <div className="p">{user?.username}</div>
                <SettingsButton handler={()=>{}}>Change</SettingsButton>
            </div>
            <div className="flex flex-col gap-2 border-1 border-[#ffffff11] p-2 w-fit" >
                <div className="">
                    Password
                </div>
                <div className="">****************</div>
                <SettingsButton handler={()=>{}}>Change</SettingsButton>
            </div>
            <div className="flex flex-col gap-2 border-1 border-[#ffffff11] p-2 w-fit">
                <div className="">
                    Email
                </div>
                <div>
                    <input type="text" value={user && user.email && user?.email
                        .split('.')
                        .map((val, idx) => (idx === 0 ? val.replace(/\*/g, '✱') : val))
                        .join('.')} />
                    
                </div>
                <SettingsButton handler={()=>{}}>Change</SettingsButton>
            </div>
            <div className="flex flex-col gap-2 border-1 border-[#ffffff11] p-2 w-fit">
                <div className="w-40">
                    Number
                </div>
                <input type="text" />
                <SettingsButton handler={()=>{}}>Change</SettingsButton>
            
            </div>
        </div>
    );
};

export default AccountSettings;
