// src/layouts/AppLayout.tsx
import { Outlet } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import {http} from "../../api/http";
import {ParticlesBackground} from "./ParticlesBackground";

export default function AppLayout() {
    const [globalData, setGlobalData] = useState<any>(null);
    const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
        return localStorage.getItem("preferred-language") || "vi";
    });

    // Lắng nghe sự kiện thay đổi ngôn ngữ
    useEffect(() => {
        const handleLanguageChange = (event: CustomEvent) => {
            setCurrentLanguage(event.detail.language);
        };

        window.addEventListener('languageChange', handleLanguageChange as EventListener);
        return () => {
            window.removeEventListener('languageChange', handleLanguageChange as EventListener);
        };
    }, []);

    // Gọi API global khi ngôn ngữ thay đổi
    useEffect(() => {
        const fetchGlobal = async () => {
            try {
                console.log(`Gọi API global với ngôn ngữ: ${currentLanguage}`);
                const res = await http.get(`/public/pages/global?lang=${currentLanguage}`);
                console.log("Global data:", res.data);
                setGlobalData(res.data);
            } catch (error) {
                console.error("Lỗi gọi API global:", error);
            }
        };

        fetchGlobal();
    }, [currentLanguage]);

    return (
        <>
            <Header cmsData={globalData?.sections?.[0]?.data} />
            <main>
                <Outlet />
            </main>
            <Footer cmsData={globalData?.sections?.[1]?.data} />
        </>

    );
}