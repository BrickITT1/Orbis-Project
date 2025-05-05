import React, { PureComponent } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import "../../styles/layout/layout.scss";
import { Main } from "./Main";

export const Layout: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    return (
        <>
            <Main></Main>
            <Header />
            <main>{children}</main>
            <Footer />
        </>
    );
};
