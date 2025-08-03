import React from "react";
import { ActionLayout } from "./ActionsLayout";
import { useAppSelector } from "@/app/hooks";

const ManagerVisible = () => {
    const actions = useAppSelector(s => s.action.Action);
    console.log(actions)
    return (
        <>
            {
            actions.length > 0 && <>
                <div className="actions-visible-items">
                    {actions?.map(val => (
                        <ActionLayout key={val.id} id={val.id} type={val.type} text={val.text} ttl={val.duration}/>
                    ))}
                </div>
            </>
            }
        </>

    )
}

export default ManagerVisible;