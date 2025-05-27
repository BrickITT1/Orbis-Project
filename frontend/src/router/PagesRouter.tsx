import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { HomePage } from "../pages/HomePage";
import { Layout } from "../components/Layouts/Layout";
import { ServersPage } from "../pages/ServersPage";
import { SafePage } from "../pages/Article/SafePage";
import CustomScroll from "../components/scroll/CustomScroll";
import { TermsPage } from "../pages/Article/TermsPage";
import { LicescePage } from "../pages/Article/LicescePage";
import { PrivacyPage } from "../pages/Article/PrivacyPage";
import { AppPage } from "../pages/AppPage";
import { AuthPageController } from "../pages/AuthForm";
import { useAppSelector } from "../app/hooks";
import { useRefreshTokenMutation } from "../services/auth";
import { SettingAppPage } from "../pages/SettingAppPage";

const ProtectedRoute: React.FC<{
    isAuth: boolean;
    children: React.ReactNode;
    path?: string;
}> = ({ isAuth, children, path }) => {
    if (path) {
        return isAuth ? <>{children}</> : <Navigate to={path} />;
    }
    return isAuth ? <>{children}</> : <Navigate to={"/"} />;
};

export const PagesRouter: React.FC = () => {
    const isAuth =
        useAppSelector((state) => state.auth.isAuthenticated) || false;
    const [data, { isLoading }] = useRefreshTokenMutation({});
    const [isRefreshing, setIsRefreshing] = useState(true);

    const refresh = async () => {
        try {
            await data({});
            setIsRefreshing(false);
            console.log(isAuth);
        } catch (error) {
            console.error("Refresh failed:", error);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    // if (isRefreshing) {
    //     return <div className="main-app">Loading...</div>; // Показать индикатор загрузки, пока обновляется токен
    // }

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
                        <ProtectedRoute isAuth={!isAuth} path="/app">
                            <AuthPageController type="login" />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <>
                            <AuthPageController type="register" />
                        </>
                    }
                />
                <Route
                    path="/servers"
                    element={
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
                    element={
                        <Layout>
                            <div className="container">
                                <SafePage />
                            </div>
                        </Layout>
                    }
                />
                <Route
                    path="/terms"
                    element={
                        <Layout>
                            <div className="container">
                                <TermsPage />
                            </div>
                        </Layout>
                    }
                />
                <Route
                    path="/privacy"
                    element={
                        <Layout>
                            <div className="container">
                                <PrivacyPage />
                            </div>
                        </Layout>
                    }
                />
                <Route
                    path="/licesce"
                    element={
                        <Layout>
                            <div className="container">
                                <LicescePage />
                            </div>
                        </Layout>
                    }
                />
                <Route 
                    path="/app/settings"
                    element= {
                        <ProtectedRoute isAuth={isAuth}>
                            <SettingAppPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/app"
                    element={
                        <ProtectedRoute isAuth={isAuth}>
                            <AppPage />
                        </ProtectedRoute>
                    }
                />
                
            </Routes>
        </BrowserRouter>
    );
};
