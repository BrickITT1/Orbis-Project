import React, { useEffect, useState, useRef, useCallback } from "react";
import { ModalLayout } from "../Layouts/Modal/Modal";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { useAddFriendMutation, useLazyGetUserbyNameQuery, useStartChattingMutation } from "../../services/user";
import { endSearch } from "../../features/user/userSlices";
import { addAction } from "../../features/action/actionSlice";

export const Search: React.FC = () => {
    const check = useAppSelector(s => s.user.isSearchActive);
    const dispatch = useAppDispatch();
    const [find, setFind] = useState<string>(""); 
    const searchRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout>();
    const [trigger, {data, isSuccess: isSuccessSearch}] = useLazyGetUserbyNameQuery();
    const myid = useAppSelector(s => s.auth.user?.info.id);
    const [startChatting, {isSuccess: isSuccessChat, isError: isErrorChat}] = useStartChattingMutation();
    const [inviteFriend] = useAddFriendMutation();
    
    const debounce = useCallback((value: string) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        
        timerRef.current = setTimeout(() => {
            trigger(value);
        }, 500); // 500ms задержка
    }, []);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFind(value);
        debounce(value);
    };

    useEffect(()=> {
        if (!isSuccessChat)  return
        dispatch(addAction({id: Date.now() ,type: 'SUCCESS', text:'Success create chat', duration: 3000}))
    }, [isSuccessChat])
    
    useEffect(()=> {
        if (!isErrorChat)  return
        dispatch(addAction({id: Date.now() ,type: 'ERROR', text:'Error added', duration: 3000}))
    }, [isErrorChat])
    
    
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                    // Клик вне блока .profile
                    dispatch(endSearch()); // закрытие профиля или нужное действие
                }
            };
    
            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }, [dispatch]);
    
    if (!check) return null;
    return (
        <ModalLayout> 
            <div className="search-friend" ref={searchRef}>
                <h2>Search friend by name</h2>
                <input 
                    type="text" 
                    onChange={handleChange} 
                    value={find}
                    placeholder="Enter name"
                />
                <ul className="result">
                    <h3>Results:</h3>
                    {data && data.map((val: any, idx: number) => {

                        if (val.id == myid) return null
                        return(
                        <li key={`seatch-user-${idx}`}>
                            <div className="name">
                                <img src={val.avatar_url} alt="" width={"40px"} height={"40px"}/>{val.username}
                            </div>
                            <div className="search-actions">
                                <button className="start-message" onClick={()=> startChatting(val.id)}>start message</button>
                                <button className="start-message" onClick={()=> inviteFriend(val.id)}>add friend</button>
                            </div>
                        </li>
                    )})}
                </ul>
            </div>
        </ModalLayout>
    );
};