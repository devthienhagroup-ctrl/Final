import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { Layout } from "./components/Layout";
import { AuthProvider } from "./app/auth.store";
import { RequireAuth } from "./app/guard";

import { LoginPage } from "./pages/LoginPage";
import { CmsPagesPage } from "./pages/CmsPagesPage";
import { CmsEditPage } from "./pages/CmsEditPage";
import { LeadsPage } from "./pages/LeadsPage";
import { NotFound } from "./pages/NotFound";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/cms/pages" replace />} />
          <Route path="cms/pages" element={<CmsPagesPage />} />
          <Route path="cms/pages/:slug" element={<CmsEditPage />} />
          <Route path="leads" element={<LeadsPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
