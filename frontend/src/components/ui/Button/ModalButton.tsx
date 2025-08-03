import React from "react";

export const ModalButton: React.FC<{ children: React.ReactNode, handler: () =>void }> = ({
    children, handler
}) => {
    return (
        <button className="bg-[#1f4de4] pl-5 pr-5 text-4xl  lg:text-base " onClick={()=> handler()}>
            {children}
        </button>
                
                
    );
};
