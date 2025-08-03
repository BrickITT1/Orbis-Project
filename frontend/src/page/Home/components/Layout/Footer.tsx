import React from "react";
import { NavBar } from "../Shared/NavBar";
import { Send, Youtube } from "lucide-react";

export const Footer = () => {
    return (
        <>
            <footer className="text-white py-10 px-5 bg-gradient-to-t from-[#0046d25e] to-[#04122f7c]">
                <div className="h-fit w-full flex flex-col gap-5 lg:max-w-7xl mx-auto lg:flex-row lg:justify-between ">
                    <div className="flex gap-5">
                        <div className="">
                            <img src="/img/icon.png" alt="" />
                        </div>
                        <div className="">
                            <h2 className="font-[sarpanch] text-5xl ">ORBIS</h2>
                            <p className="text-2xl">Неважно где ты, важно с нами. <br />Мы здесь, чтобы стать ближе.</p>
                        </div>
                    </div>
                    <div className="flex gap-5">
                        <div className="w-full">
                            <h2 className="text-5xl lg:text-3xl">Навигация</h2>
                            <NavBar styleContainer="flex bg-transparent flex-row w-full justify-between lg:flex-col lg:text-2xl lg:gap-0" styleList="cursor-pointer select-none !p-1"/>
                        </div>
                    </div>
                    <div className="flex gap-5">
                        <div className="w-full">
                            <h2 className="text-5xl lg:text-3xl">Социальные сети</h2>
                            <div className="text-3xl lg:text-2xl">
                                <div className="flex gap-5">
                                    <Youtube className="w-10 h-10" />
                                    <div className="">OrbisYT</div>
                                    
                                </div>
                                <div className="flex gap-5">
                                    <Send className="w-10 h-10" />
                                    <div className="">OrbisTG</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-5">
                        <div className="w-full">
                            <h2 className="text-5xl lg:text-3xl">Связь с нами</h2>
                            <div className="text-3xl lg:text-2xl">
                                <div className="">orbis.help@orbis.ru</div>
                                <div className="">orbis.help2@orbis.ru</div>
                                <div className="">orbis.help3@orbis.ru</div>
                                <div className="">orbis.help4@orbis.ru</div>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
};
