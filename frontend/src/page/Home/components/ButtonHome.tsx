import React from "react"

export const ButtonHome: React.FC<{ children: React.ReactNode, handler?: ()=> void, buttonclass?: string }> = ({children,handler=()=>{},  buttonclass=""}) => {
    return (
        <button className={`p-5 bg-transparent cursor-pointer shadow-[0_0_16px_6px_rgba(8,42,236,0.2)] text-3xl w-full ${buttonclass}` }>
            {children}
        </button>
    )
}