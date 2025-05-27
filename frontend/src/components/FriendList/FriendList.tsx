import React, { useEffect, useState } from "react";
import { useGetFriendQuery, useLazyGetInfoUserQuery, useLazyGetFriendQuery,
    useLazyGetInviteIQuery,
    useLazyGetInviteMeQuery } from "../../services/user";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { startSearch } from "../../features/user/userSlices";

type ModeKeys = 'Online' | 'Offline' | 'All' | 'Invite' | 'My Invite';
type ModeState = Record<ModeKeys, boolean>;

export const FriendList: React.FC = () => {
    const dispatch = useAppDispatch();
    const [mode, setMode] = useState<ModeState>({
        'All': true,
        'Online': false,
        'Offline': false,
        'My Invite': false,
        'Invite': false,
    });
    const friends = useAppSelector(s => s.user.friends);
    const [trigger, { data, isFetching, error }] = useLazyGetInfoUserQuery();
    const [getFriends] = useLazyGetFriendQuery();
    const [getInvI] = useLazyGetInviteIQuery();
    const [getInvMe] = useLazyGetInviteMeQuery();
    
    const handleClick = (id: number) => {
        trigger(id); // Выполняем запрос с конкретным ID
    };

    useEffect(()=> {
        
        const selectedKey = Object.entries(mode).find(([key, value]) => value === true)?.[0];
        if (selectedKey == 'All') {
            getFriends({})
        }
        if (selectedKey == 'My Invite') {
            getInvMe({})
        }
        if (selectedKey == 'Invite') {
            getInvI({})
        }
    }, [mode])
    
    const {} = useGetFriendQuery({});

    return (
        <>
            <div className="friend-list">
                <div className="friend-container">
                    <div className="friend-menu">
                        <h1>Friends</h1>
                        {(Object.keys(mode) as ModeKeys[]).map(val => (
                            <button 
                                key={`friend-${val}-button`}
                                className={mode[val] ? "isActive" : ""}
                                onClick={() => {
                                    const newMode = {} as ModeState;
                                    (Object.keys(mode) as ModeKeys[]).forEach(key => {
                                        newMode[key] = key === val;
                                    });
                                    setMode(newMode);
                                }}
                            >
                                {val}
                            </button>
                        ))}
                        <button className="add-friend" onClick={() => dispatch(startSearch())}>Add friend</button>
                    </div>
                    <ul className="friend">
                    {friends && friends.map((val)=>(
                        <li key={`friend-${val.id}-${val.username}-item`}>
                            
                                
                                <div className="name" onClick={()=> {
                                handleClick(val.id)
                            }}>
                                <img src="/img/icon.png" alt="" width={"30px"} height={"30px"}/> {val.username}
                            </div>
                            
                            <div className="manage">
                                <button className="remove">
                                    <svg width="25" height="25" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M36.5 1.5L1.5 36.5M1.50003 1.5L36.5 36.5" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>


                                </button>
                                <button className="start-message"><svg width="30" height="30" viewBox="0 0 47 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11.1189 13.3821H36.1189M11.1189 23.3821H23.6189M46.1189 40.8821L37.8081 36.7266C37.1781 36.4116 36.8631 36.2541 36.5329 36.1431C36.2399 36.0446 35.9381 35.9733 35.6319 35.9303C35.2869 35.8821 34.9346 35.8821 34.2304 35.8821H9.1189C6.31862 35.8821 4.9185 35.8821 3.84895 35.3371C2.90812 34.8578 2.14322 34.0928 1.66387 33.1521C1.1189 32.0826 1.1189 30.6823 1.1189 27.8821V8.88208C1.1189 6.0818 1.1189 4.68168 1.66387 3.61213C2.14322 2.67131 2.90812 1.9064 3.84895 1.42705C4.9185 0.88208 6.31865 0.88208 9.1189 0.88208H38.1189C40.9191 0.88208 42.3194 0.88208 43.3889 1.42705C44.3296 1.9064 45.0946 2.67131 45.5739 3.61213C46.1189 4.68168 46.1189 6.08183 46.1189 8.88208V40.8821Z" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
                </div>
                
            </div>
        </>
    );
};