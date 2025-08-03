import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { HomePage } from "@/page/Home/index";
import { Layout } from "@/page/Home/components/Layout/Layout";
import { useAppSelector } from "@/app/hooks";
import { PoliticalPage } from "@/page/Political";
import AuthPageController from "@/page/Auth";
import { CommunicatePage } from "@/page/Communicate";
import { useRefreshTokenMutation } from "@/features/auth";
import { SettingAppPage } from "./page/Settings";

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
    const [isRefreshing, setIsRefreshing] = useState(false);

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
        //refresh();
    }, []);

    if (isRefreshing) {
        return <div className="main-app">Loading...</div>; // Показать индикатор загрузки, пока обновляется токен
    }

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
                    path="/political"
                    element={
                        <Layout>
                                <PoliticalPage />
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
                            <CommunicatePage />
                        </ProtectedRoute>
                    }
                />
                
            </Routes>
        </BrowserRouter>
    );
};
