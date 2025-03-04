import React, { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "./styles/global.scss";
import "./styles/typography.scss"
import { store } from "./app/store";
import { Provider } from "react-redux";
import { PagesRouter } from "./router/PagesRouter";
// Найдите корневой элемент
const rootElement: HTMLElement | null = document.getElementById("root");

// Создайте корень и отрендерьте приложение
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);

    root.render(
        <StrictMode>
            <Provider store={store}>
                    <PagesRouter />
            </Provider>
        </StrictMode>
    );
}
