import React from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { HomePage } from "../pages/HomePage"
import { LoginPage } from "../pages/LoginPage";
import { Layout } from "../components/Layouts/Layout";

const ProtectedRoute: React.FC<{
    isAuth: boolean;
    children: React.ReactNode;
}> = ({ isAuth, children }) => {
    console.log(isAuth);
    return isAuth ? <>{children}</> : <Navigate to="/" />;
};

export const PagesRouter: React.FC = () => {
    //const isAuth = useSelector(selectAuth) || false;
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={
                        <Layout>
                            <HomePage />
                        </Layout>

                    }
                />
                <Route
                    path="/login"
                    element={
                            <LoginPage type="login"/>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <>
                            <LoginPage type="register"/>
                        </>
                    }
                />
                <Route
                    path="/confirm"
                    element={
                        <>
                            <LoginPage type="confirmemail"/>
                        </>
                    }
                />
                {/* <Route
                    path="/profile"
                    element={
                        <ProtectedRoute isAuth={isAuth}>
                            <Layout>
                                <ProfilePage />
                            </Layout>
                        </ProtectedRoute>
                    }
                ></Route> */}
            </Routes>
            
        </BrowserRouter>
    );
};
