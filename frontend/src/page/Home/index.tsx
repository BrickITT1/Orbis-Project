
import React from "react";
import { HeroSection } from "./sections/Hero";
import { Edge } from "./sections/Edge";
import { ShowCase } from "./sections/Showcase";
import { Slider } from "./sections/Slider";
import { Start } from "./sections/Start";
import { Support } from "./sections/Support";

export const HomePage = () => {
    return (
        <>
            <HeroSection />     
            <Edge />      
            <ShowCase /> 
            <Slider />
            <Start />
            <Support />
        </>
    );
};
