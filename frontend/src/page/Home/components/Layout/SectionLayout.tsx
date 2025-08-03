import React from "react"

export const SectionLayout: React.FC<{ children: React.ReactNode, classListContainer?: string}> = ({children, classListContainer=""}) => {
    return (
        <div className={`mx-auto max-w-2xl py-10 text-white flex flex-col lg:max-w-7xl ${classListContainer}`}>
            {children}
        </div>
    )
}