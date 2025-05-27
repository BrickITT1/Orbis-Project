import React, { useEffect, useState, useRef } from "react";
import { ModalLayout } from "../Layouts/Modal/Modal";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { closeProfile } from "../../features/user/userSlices";

export const Profile: React.FC = () => {
    const [infoStage, setInfoStage] = useState<number>(0);
    const dispatch = useAppDispatch();
    const userInfo = useAppSelector(s => s.user.openProfile);
    const check = useAppSelector(s => s.user.isOpenProfile);

    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                // Клик вне блока .profile
                dispatch(closeProfile()); // закрытие профиля или нужное действие
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dispatch]);
    
    if (!check) return null
    
    return (
        <ModalLayout> 
            <div className="profile" ref={profileRef}>
                <div className="">
                    <div className="info">
                        <div className="avatar">
                            <img src={userInfo && userInfo.avatar_url ? userInfo.avatar_url : "/img/icon.png"} alt="" className="" /> <span></span>
                        </div>
                        <div className="name">
                            {userInfo?.username}
                        </div>
                        
                    </div>
                    <div className="manage-info">
                        <button className={infoStage === 0 ? "active": ""} onClick={() => setInfoStage(0)}>About</button>
                        <button className={infoStage === 1 ? "active": ""} onClick={() => setInfoStage(1)}>Mutual friends</button>
                        <button className={infoStage === 2 ? "active": ""} onClick={() => setInfoStage(2)}>Mutual servers</button>
                    </div>
                </div>
                <div className="about-user">
                    {infoStage === 0 && 
                        <div>
                            {userInfo?.about}    
                        </div>
                    }
                    {infoStage === 1 && 
                        <div>
                            Lorem, ipsum dolor sit amet consectetur adipisicing elit. Tempora ex error maxime quae aliquam temporibus modi repudiandae eligendi rerum voluptatibus et, voluptates, velit totam dicta animi alias quibusdam dolorem! Dolorum!
                        </div>
                    }
                    {infoStage === 2 && 
                        <div>
                            Lorem, ipsum dolor sit amet consectetur adipisicing elit. Tempora ex error maxime quae aliquam temporibus modi repudiandae eligendi rerum voluptatibus et, voluptates, velit totam dicta animi alias quibusdam dolorem! Dolorum!
                            Lorem, ipsum dolor sit amet consectetur adipisicing elit. Tempora ex error maxime quae aliquam temporibus modi repudiandae eligendi rerum voluptatibus et, voluptates, velit totam dicta animi alias quibusdam dolorem! Dolorum!
                        </div>
                    }
                </div>
            </div>
        </ModalLayout>
        
    );
};
