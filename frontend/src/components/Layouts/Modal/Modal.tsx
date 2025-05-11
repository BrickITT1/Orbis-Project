import React from "react";
import "../../../styles/layout/modal.scss";

export const ModalLayout: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    return (
        
        <div className="modal__layout">
            <div className="modal">
                {children}
            </div>
        </div>
        
    );
};
