import React from "react";

export const DefaultButton: React.FC<{ children: React.ReactNode, handler: () =>void }> = ({
    children, handler
}) => {
    return (
        <button className="bg-transparent cursor-pointer pl-3 pr-3 hover:border-b mb-[-1px]" onClick={()=> handler()}>
            {children}
        </button>   
    );
};
