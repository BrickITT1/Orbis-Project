
import { Circle } from "lucide-react";
import React from "react";
import { SectionLayout } from "../../components/Layout/SectionLayout";
import { TitleSection } from "../../components/UI/TitleSection";

export const Edge = () => {

    return (
        <div className="bg-[rgba(27,30,75,0.3)]">
            <SectionLayout classListContainer="flex flex-col gap-5 lg:max-w-7xl">
                <TitleSection>Неважно где, важно с нами</TitleSection>
                <ul className="[&>li]:flex [&>li]:text-2xl [&>li]:gap-5 [&>li]:w-[25rem]  flex flex-col justify-center text-white lg:flex-row lg:[&>li]:w-fit lg:justify-between">
                    <li><Circle className="w-6 h-6 mt-1 lg:w-10 lg:h-10" strokeWidth={0.5}/>Стабильное соединение</li>
                    <li><Circle className="w-6 h-6 mt-1 lg:w-10 lg:h-10" strokeWidth={0.5}/>Чёткий звук</li>
                    <li><Circle className="w-6 h-6 mt-1 lg:w-10 lg:h-10" strokeWidth={0.5}/>Быстрая связь</li>
                </ul>
            </SectionLayout>
        </div>
    )
}