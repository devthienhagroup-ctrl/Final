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
import { ProductAdminListPage } from "./pages/ProductAdminListPage";
import { ProductAdminDetailPage } from "./pages/ProductAdminDetailPage";
import { CatalogCrudPage } from "./pages/CatalogCrudPage";
import { HomePage } from "./pages/HomePage";
import OrderAdminPage from "./pages/OrderAdminPage";
import { ReviewsAdminPage } from "./pages/ReviewsAdminPage";

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
          <Route index element={<HomePage />} />
          <Route path="cms/pages" element={<CmsPagesPage />} />
          <Route path="cms/pages/:slug" element={<CmsEditPage />} />
          <Route path="catalog/products" element={<ProductAdminListPage />} />
          <Route path="catalog/products/:productId" element={<ProductAdminDetailPage />} />
          <Route path="orders" element={<OrderAdminPage />} />
          <Route path="reviews" element={<ReviewsAdminPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
