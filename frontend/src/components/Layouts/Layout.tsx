import React, { PureComponent } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import "../../styles/layout/layout.scss"

export const Layout: React.FC<{children: React.ReactNode}> = ({ children }) => {
    return (
        <>
            <Header />
            <main>
                {children}
            </main>
            <Footer />
        </>
    )
}