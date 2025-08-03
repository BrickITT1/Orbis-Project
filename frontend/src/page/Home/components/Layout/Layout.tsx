import React, { PureComponent } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export const Layout: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    return (
        <>
            <Header />
                <main className="w-full">
                    {children}
                </main>
            <Footer />
        </>
    );
};
