import React, { useEffect, useState, useRef, useCallback } from "react";
import { ModalLayout } from "@/components/layout/Modal/Modal";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { useAddFriendMutation, useLazyGetUserbyNameQuery, useStartChattingMutation } from "../../api/userApi";
import { endSearch } from "@/features/user/userSlices";
import { addAction } from "@/features/action/index";
import { ModalButton } from "@/components/ui/Button/ModalButton";

const Search: React.FC = () => {
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
            <div className="p-10 text-white flex flex-col gap-5" ref={searchRef}>
                <h2 className="text-center text-5xl lg:text-2xl">Search friend by name</h2>
                <input 
                    type="text" 
                    onChange={handleChange} 
                    value={find}
                    placeholder="Enter name"
                    className=" box-border border-b-1 outline-0 w-full text-4xl lg:text-base"
                />
                <ul className="result">
                    <h3 className="text-5xl lg:text-2xl border-b border-b-[#ffffff3a]">Results:</h3>
                    {data && data.map((val: any, idx: number) => {

                        if (val.id == myid) return null
                        return(
                        <li key={`seatch-user-${idx}`} className="flex gap-10 bg-[#4a55e9] p-3 justify-between">
                            <div className="flex items-center gap-2">
                                <img src={val.avatar_url} alt="" className="w-15 h-15 lg:w-10 lg:h-10"/><span className="text-3xl lg:text-base">{val.username}</span>
                            </div>
                            <div className="flex gap-5 ">
                                <ModalButton handler={()=> startChatting(val.id)}>Message</ModalButton>
                                <ModalButton handler={()=> inviteFriend(val.id)}>Add friend</ModalButton>
                            </div>
                        </li>
                    )})}
                </ul>
            </div>
        </ModalLayout>
    );
};

export default Search;
