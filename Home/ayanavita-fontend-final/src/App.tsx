import { Route, Routes } from "react-router-dom";

import Layout from "./components/layout/Layout";
import BookingPage from "./pages/BookingPage";
import BlogPage from "./pages/BlogPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import ComparePage from "./pages/ComparePage";
import ContactPage from "./pages/ContactPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import CoursePlayerPage from "./pages/CoursePlayerPage";
import CoursesPage from "./pages/CoursesPage";
import HomePage from "./pages/HomePage";
import LessonDetailPage from "./pages/LessonDetailPage";
import ProductCheckoutPage from "./pages/ProductCheckoutPage";
import ProductDetailPage from "./pages/ProductDetailPage";

import ProductsPage from "./pages/ProductsPage";
import ReviewsCenterPage from "./pages/ReviewsCenterPage";
import ServiceDetailPage from "./pages/ServiceDetailPage";
import ServicesPage from "./pages/ServicesPage";
import TrackOrderPage from "./pages/TrackOrderPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/:serviceId" element={<ServiceDetailPage />} />
        <Route path="/booking" element={<BookingPage />} />

        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:courseId" element={<CourseDetailPage />} />
        <Route path="/courses/:courseId/lesson" element={<LessonDetailPage />} />
        <Route path="/courses/player" element={<CoursePlayerPage />} />

        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/product-checkout" element={<ProductCheckoutPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/track-order" element={<TrackOrderPage />} />

        <Route path="/reviews" element={<ReviewsCenterPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/contact" element={<ContactPage />} />


        <Route path="/franchise" element={<div className="p-6">Franchise (todo)</div>} />
        <Route path="/account" element={<div className="p-6">Account (todo)</div>} />
        <Route path="*" element={<div className="p-6">Not found</div>} />
      </Route>
    </Routes>
  );
}
