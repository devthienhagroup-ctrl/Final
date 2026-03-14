// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { CartProvider } from "./contexts/CartContext";
import "./styles/aya-course-player.css";
import ScrollToTop from "./ScrollToTop";
import CookieConsentBanner from "./components/common/CookieConsentBanner";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ScrollToTop />
      <CartProvider>
        <App />
        <CookieConsentBanner />
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
