import React, { useEffect, useState } from "react";
import { useGetFriendQuery, useLazyGetInfoUserQuery, useLazyGetFriendQuery,
    useLazyGetInviteIQuery,
    useLazyGetInviteMeQuery, 
    useConfirmFriendMutation,
    useRejectFriendMutation,
    useStartChattingMutation} from "../../api/userApi";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { setFriendMode, startSearch } from "../../userSlices";
import { CircleMinus, CirclePlus, Menu, MessageSquare } from "lucide-react";
import { DefaultButton } from "@/components/ui/Button/DefaultButton";




const FriendList: React.FC = () => {
    const dispatch = useAppDispatch();
    const mode = useAppSelector(s => s.user.friendsMode);
    const friends = useAppSelector(s => s.user.friends);
    const [trigger] = useLazyGetInfoUserQuery();
    const [getFriends] = useLazyGetFriendQuery();
    const [getInvI] = useLazyGetInviteIQuery();
    const [getInvMe] = useLazyGetInviteMeQuery();
    const [confirm, {isSuccess: confirmSuccess}] = useConfirmFriendMutation();
    const [reject, {isSuccess: confirmReject}] = useRejectFriendMutation();
    const [startChatting, {isSuccess: isSuccessChat, isError: isErrorChat}] = useStartChattingMutation();
    const {} = useGetFriendQuery({});
    const [menuActive, setMenuActive] = useState(window.innerWidth > 1024 || false);
    
    const handleClick = (id: number) => {
        trigger(id); // Выполняем запрос с конкретным ID
    };

    useEffect(() => {
        if (!mode) return;
        const modeActions: Record<string, () => void> = {
            'All': () => getFriends({}),
            'My Invite': () => getInvMe({}),
            'Invite': () => getInvI({}),
            'Online': () => getFriends({}),
            'Offline': () => getFriends({}),
        };

        const action = modeActions[mode];
        if (action) {
            action();
        }
    }, [mode]);

    useEffect(()=> {
        if (confirmSuccess || confirmReject) {
            dispatch(setFriendMode(mode))
        }
    }, [confirmSuccess, confirmReject])


    return (
        <>
            <div className="w-full h-full flex flex-col text-white p-5 rounded-[5px] z-10">
                    <div className="relative flex bg-[#2e3ed34f] text-white text-1xl p-0 lg:p-2 lg:pl-20 lg:pr-20 items-center gap-5 rounded-[5px] justify-between lg:justify-normal">
                        <h1 className="text-5xl lg:text-base pl-2 lg:pl-0">Friends</h1>
                        <button onClick={()=>{
                            if (window.innerWidth > 1024) return;
                            setMenuActive(prev => (window.innerWidth > 1024 || !prev))
                        }}>
                            <Menu className="w-15 h-15 lg:w-10 lg:h-10"  />
                        </button>
                        
                        {menuActive && <div className="bg-[#2e3ed3] lg:bg-transparent flex items-center absolute lg:relative top-15 rounded-[5px] lg:top-0 flex-col lg:flex-row p-5 text-5xl lg:p-0 lg:text-base gap-5 lg:gap-0 w-full">
                            
                            <DefaultButton handler={()=> {
                                dispatch(setFriendMode('All'));
                                setMenuActive(prev => (window.innerWidth > 1024 || !prev))
                            }}>
                                All Friends
                            </DefaultButton>
                            <DefaultButton handler={()=> {
                                dispatch(setFriendMode('Online'))
                                setMenuActive(prev => (window.innerWidth > 1024 || !prev))
                            }}>
                                Online Friends
                            </DefaultButton>
                            <DefaultButton handler={()=> {
                                dispatch(setFriendMode('Offline'))
                                setMenuActive(prev => (window.innerWidth > 1024 || !prev))
                            }}>
                                Offline Friends
                            </DefaultButton>
                            <DefaultButton handler={()=> {
                                dispatch(setFriendMode('Invite'))
                                setMenuActive(prev => (window.innerWidth > 1024 || !prev))
                            }}>
                                Sent Invites
                            </DefaultButton>
                            <DefaultButton handler={()=> {
                                dispatch(setFriendMode('My Invite'))
                                setMenuActive(prev => (window.innerWidth > 1024 || !prev))
                            }}>
                                Received Invites
                            </DefaultButton>
                            
                            <DefaultButton handler={() => {
                                dispatch(startSearch())
                                setMenuActive(prev => (window.innerWidth > 1024 || !prev))
                            }}>Add friend</DefaultButton>
                        </div>}
                        
                    </div>
                    <ul className="bg-[#25309b88] h-full flex flex-col gap-5 p-5 rounded-b-[5px]">
                    {friends && friends.map((val)=>(
                        <li key={`friend-${val.id}-${val.username}-item`} className="flex bg-[#4b58cc88] p-2 items-center">
                                <div className="text-3xl lg:text-base w-full flex gap-3 items-center" onClick={()=> {
                                handleClick(val.id)
                            }}>
                                <img src="/img/icon.png" alt="" className="w-15 h-15 lg:w-8 lg:h-8"/> <span>{val.username}</span>
                            </div>
                            
                            <div className="flex gap-2">
                                {mode == 'My Invite' &&
                                    <>
                                    <button className="" onClick={()=>{
                                        confirm(val.id);
                                    }}>
                                        <CirclePlus color="white" className="w-15 h-15 lg:w-8 lg:h-8" strokeWidth={"1.25"}/>
                                    </button>
                                    <button className="" onClick={() => {
                                        reject(val.id);
                                    }}>
                                        <CircleMinus color="white" className="w-15 h-15 lg:w-8 lg:h-8" strokeWidth={"1.25"}/>
                                    </button>
                                    </>
                                } 
                                
                                <button className="" onClick={()=> {
                                    startChatting(val.id)
                                }}>
                                    <MessageSquare color="white" className="w-15 h-15 lg:w-8 lg:h-8" strokeWidth={"1.25"}/>
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>          
            </div>
        </>
    );
};

export default FriendList
