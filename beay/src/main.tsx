import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./app/routes";
import { ToastProvider } from "./ui/toast";

import "./index.css"; // tailwind base (nếu bạn đang dùng)

ReactDOM.createRoot(document.getElementById("root")!).render(

    <BrowserRouter>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
);