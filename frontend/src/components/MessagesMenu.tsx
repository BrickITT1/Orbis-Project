import React from 'react';

export const MessageMenu: React.FC = () =>  {
    
    return ( 
        <>
            <div className="messages-menu">
                <h1>ORBIS<span>chat</span></h1>
                <div className="messages-menu_list">
                    <div className="messages-menu_list-group">
                        <h2>Чаты</h2>
                        <ul className="group-list">
                            
                            {
                                Array.from({length: 8}).map((_, index) => (
                                    <li className="group-item">
                                        <div className="" key={index}>
                                            <div className="group-item__avatar">
                                                <img src="/img/icons.png" alt="" />
                                            </div>
                                            Группа {index}
                                        </div>
                                    </li>
                                ))
                            }
                            {
                                Array.from({length: 8}).map((_, index) => (
                                    <li className="group-item">
                                        <div className="" key={index + 100}>
                                            <div className="group-item__avatar">
                                                <img src="/img/icon.png" alt="" />
                                            </div>
                                            Друзья {index}
                                        </div>
                                    </li>
                                ))
                            }
                        </ul>
                    </div>
                    
                </div>
                <div className="messages-menu_list-search">
                        <input type="text" />
                    </div>
            </div>
            
        </> 
    );
}