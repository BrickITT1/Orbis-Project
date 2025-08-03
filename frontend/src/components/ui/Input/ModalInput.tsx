import React, { ChangeEvent } from "react";

export const ModalInput: React.FC<{ change: (e: ChangeEvent) => void, value?: string; name?: string; placeHolder?: string}> = ({
    change, value, name, placeHolder
}) => {
    return (
        <input className="w-full p-2 border-b outline-none" type="text" placeholder={placeHolder} name={name} value={value} onChange={(e) => change(e)} />       
                
    );
};
