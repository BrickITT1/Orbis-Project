import React from "react";

export const SettingsButton: React.FC<{ children: React.ReactNode, handler: () =>void }> = ({
    children, handler
}) => {
    return (
        <button className="bg-[#1f4bda5b] brightness-100 w-fit pl-10 pr-10 pt-1 pb-1 rounded-[5px] cursor-pointer hover:brightness-90 select-none" onClick={()=> handler()}>
            {children}
        </button>   
    );
};
