import React from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { HomePage } from "../pages/HomePage"
import { Layout } from "../components/Layouts/Layout";
import { ServersPage } from "../pages/ServersPage";
import { SafePage } from "../pages/Article/SafePage";
import CustomScroll from "../components/scroll/CustomScroll";
import { TermsPage } from "../pages/Article/TermsPage";
import { LicescePage } from "../pages/Article/LicescePage";
import { PrivacyPage } from "../pages/Article/PrivacyPage";
import { AppPage } from "../pages/AppPage";
import RegisterPage from "../components/Form/RegisterForm";
import LoginPage from "../components/Form/LoginForm";
import { AuthPageController } from "../pages/AuthForm";

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
                            <div className="container">
                                <CustomScroll>
                                    <HomePage />
                                </CustomScroll>
                            </div>
                        </Layout>

                    }
                />
                <Route
                    path="/login"
                    element={
                        <AuthPageController type='login' />
                    }
                />
                <Route
                    path="/register"
                    element={
                        <>
                            <AuthPageController type='register' />
                        </>
                    }
                />
                {/* <Route
                    path="/confirm"
                    element={
                        <>
                            <LoginPage type="confirmemail"/>
                        </>
                    }
                /> */}
                <Route 
                    path="/servers"
                    element= {
                        <Layout>
                            <div className="container">
                            <CustomScroll>
                                <ServersPage />
                            </CustomScroll>
                            </div>
                        </Layout>
                    }
                />
                <Route 
                    path="/safety"
                    element= {
                        <Layout>
                            <div className="container">
                                    <SafePage />
                            </div>
                        </Layout>
                    }
                />
                <Route 
                    path="/terms"
                    element= {
                        <Layout>
                            <div className="container">
                                    <TermsPage />
                            </div>
                        </Layout>
                    }
                />
                <Route 
                    path="/privacy"
                    element= {
                        <Layout>
                            <div className="container">
                                    <PrivacyPage />
                            </div>
                        </Layout>
                    }
                />
                <Route 
                    path="/licesce"
                    element= {
                        <Layout>
                            <div className="container">
                                    <LicescePage />
                            </div>
                        </Layout>
                    }
                />
                <Route 
                    path="/app"
                    element= {
                        <AppPage />
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
