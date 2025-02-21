import React, { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "./styles/global.scss";

// Найдите корневой элемент
const rootElement: HTMLElement | null = document.getElementById("root");

// Создайте корень и отрендерьте приложение
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <StrictMode>
            123
        </StrictMode>,
    );
}
