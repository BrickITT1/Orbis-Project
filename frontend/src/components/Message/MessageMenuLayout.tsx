import React, { PureComponent } from "react";
import "../../styles/layout/layout.scss";

export const MessageMenuLayout: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    return (
        <>
            <div className="messages-menu">
                
                <div className="messages-menu_list">
                    <div className="messages-menu_list-group">{children}</div>
                </div>
                {/* <div className="messages-menu_list-search">
                    <input type="text" />
                </div> */}
            </div>
        </>
    );
};
