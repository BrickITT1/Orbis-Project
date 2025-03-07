
import React from 'react';

export const Chat: React.FC<{name: string, avatar: string, isGroup: boolean}> = ({name, avatar, isGroup}) =>  {
    return ( 
        <>
            <li className="group-item">
                <div className="" >
                    <div className="group-item__avatar">
                        <img src={avatar} alt="" />
                    </div>
                    <div className="group-item__name">
                        {name}
                    </div>
                    
                </div>
            </li>
        </> 
    );
}
