import React from "react";

export const ModalLayout: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    return (
        
        <div className="fixed z-1000 flex justify-center items-center w-full h-full">
            <div className=" bg-[#3247be] min-w-3/4 min-h-3/5 lg:min-w-2/7 lg:min-h-3/6">
                {children}
            </div>
        </div>
        
    );
};
