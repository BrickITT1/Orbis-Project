import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { removeAction } from "@/features/action/actionSlice";
import { Visible } from "../types/visible";

export const ActionLayout: React.FC<{ type: Visible, text: string, ttl: number, id: number}> = ( {type, text, ttl, id}) => {
    const dispatch = useAppDispatch()
    
    useEffect(()=>{
        setTimeout(()=> {
            dispatch(removeAction(id))
        }, ttl)
    }, [])

    return (
        <div className="manager-visible">
            <div className="manager-visible__close">
                <button onClick={() => dispatch(removeAction(id))}>
                    X
                </button>
            </div>
            <h3>{type}</h3>
            <p>{text}</p>
        </div>
    )
}