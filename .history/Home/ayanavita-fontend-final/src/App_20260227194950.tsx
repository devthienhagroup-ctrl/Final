// src/App.tsx
import React from "react";
import {Routes, Route} from "react-router-dom";

import HomePage from "./pages/HomePage";
import ServicesPage from "./pages/ServicesPage";
import BookingPage from "./pages/BookingPage";
import ServiceDetailPage from "./pages/ServiceDetailPage";
import Layout from "./components/layout/Layout";

import CoursesPage from "./pages/CoursesPage";
import CartPage from "./pages/CartPage";
import ProductCheckoutPage from "./pages/ProductCheckoutPage";
import CheckoutPage from "./pages/CheckoutPage";
import ProductsPage from "./pages/ProductsPage";
import ComparePage from "./pages/ComparePage";
import TrackOrderPage from "./pages/TrackOrderPage";
import ProductCategoryPage from "./pages/ProductCategoryPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import CoursePlayerPage from "./pages/CoursePlayerPage";
import BlogPage from "./pages/BlogPage";
import LessonDetailPage from "./pages/LessonDetailPage";
import ReviewsCenterPage from "./pages/ReviewsCenterPage";
// ví dụ


export default function App() {
    return (
        <Routes>
            <Route element={<Layout/>}>

                <Route path="/" element={<HomePage/>}/>

                {/* Spa services */}
                <Route path="/services" element={<ServicesPage/>}/>
                <Route path="/services/:serviceId" element={<ServiceDetailPage/>}/>
                <Route path="/booking" element={<BookingPage/>}/>

                {/* Courses (prototype) */}
                <Route path="/courses" element={<CoursesPage/>}/>

                {/* Product cart (prototype) */}
                <Route path="/cart" element={<CartPage/>}/>
                <Route path="/product-checkout" element={<ProductCheckoutPage/>}/>
                {/* <Route path="/checkout" element={<CheckoutPage/>}/> */}
                <Route path="/products" element={<ProductsPage/>}/>
                <Route path="/compare" element={<ComparePage/>}/>
                <Route path="/track-order" element={<TrackOrderPage/>}/>
                <Route path="/products" element={<ProductCategoryPage/>}/>
                <Route path="/products/:slug" element={<ProductDetailPage/>}/>
                <Route path="/courses/:courseId" element={<CourseDetailPage/>}/>
                <Route path="/courses/player" element={<CoursePlayerPage/>}/>
                // truy cập: /courses/detail?courseId=CR-1001
                <Route path="/courses/:courseId/lesson" element={<LessonDetailPage/>}/>
                <Route path="/reviews" element={<ReviewsCenterPage/>}/>

                <Route path="/blog" element={<BlogPage/>}/>


                {/* placeholder các page khác để không vỡ Link */}
                <Route path="/products" element={<div className="p-6">Products (todo)</div>}/>
                <Route path="/checkout" element={<div className="p-6">Checkout (todo)</div>}/>
                <Route path="/franchise" element={<div className="p-6">Franchise (todo)</div>}/>
                <Route path="/account" element={<div className="p-6">Account (todo)</div>}/>
                <Route path="/compare" element={<div className="p-6">Compare (todo)</div>}/>
                <Route path="/track-order" element={<div className="p-6">Track order (todo)</div>}/>

                <Route path="*" element={<div className="p-6">Not found</div>}/>
            </Route>
        </Routes>
    );
}
