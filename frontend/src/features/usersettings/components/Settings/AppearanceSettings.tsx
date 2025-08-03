import React from "react";

const AppearanceSettings: React.FC = () => {
    return (
        <div className="flex flex-col gap-5">
            theme
            <select name="" id="">
                <option value="">them 1</option>
                <option value="">them 2</option>
                <option value="">them 3</option>
            </select>
            gap
            <input type="radio" name="" id="" /> 1
            <input type="radio" name="" id="" /> 2
            <input type="radio" name="" id="" /> 3
            font-size
            <input type="range" name="" id="" />
            scale
            <input type="range" name="" id="" />
        </div>
    );
};

export default AppearanceSettings;
