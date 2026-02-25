// src/pages/HomePage.tsx
import React, {useCallback, useEffect, useMemo, useState} from "react";
import { ParticlesBackground } from "../components/layout/ParticlesBackground";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";

import { TopBanner } from "../components/home/TopBanner";
import { Stats } from "../components/home/Stats";
import { Partners } from "../components/home/Partners";
import { CourseGallery } from "../components/home/CourseGallery";
import { RegisterSection } from "../components/home/RegisterSection";
import { ProductSection } from "../components/home/ProductSection";
import { Outcomes } from "../components/home/Outcomes";
import { Reviews } from "../components/home/Reviews";
import { PricingSection } from "../components/home/PricingSection";
import { ContactSection } from "../components/home/ContactSection";

import { bannerSlides, partners } from "../data/home";
import { BannerSlider } from "../components/home/BannerSlider";

import {http} from "../api/http"

export default function HomePage() {
  const [homeData, setHomeData] = useState<any>(null);
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    // Lấy language từ localStorage, mặc định là "vi"
    return localStorage.getItem("preferred-language") || "vi";
  });

  // Lắng nghe sự kiện thay đổi ngôn ngữ từ Header
  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setCurrentLanguage(event.detail.language);
    };

    window.addEventListener('languageChange', handleLanguageChange as EventListener);

    return () => {
      window.removeEventListener('languageChange', handleLanguageChange as EventListener);
    };
  }, []);


  // Gọi API khi component mount và khi language thay đổi
  useEffect(() => {
    const fetchHome = async () => {
      try {
        console.log(`Test gọi API với ngôn ngữ: ${currentLanguage}`);
        const res = await http.get(`/public/pages/home?lang=${currentLanguage}`);
        console.log(res.data);
        setHomeData(res.data);
      } catch (error) {
        console.error("Lỗi gọi API home:", error);
      }
    };

    fetchHome();
  }, [currentLanguage]); // Gọi lại API mỗi khi language thay đổi

  const onSlideAction = useCallback((action: unknown) => {
    // Xử lý action từ banner slider nếu cần
    console.log("Slide action:", action);
  }, []);

  const marqueeItems = useMemo(() => [...partners, ...partners], []);
  return (
      <div className="bg-slate-50 text-slate-900">


        <div className="page-content">

          <TopBanner cmsData={homeData?.sections[0]?.data}
              onConsult={() =>
                  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })
              }
          />

          <BannerSlider slides={homeData?.sections[1]?.data.bannerSlides} onAction={onSlideAction} />

          <Stats cmsData={homeData?.sections[2]?.data}/>

          <Partners cmsData={homeData?.sections[3]?.data}/>

          <CourseGallery cmsData={homeData?.sections[4]?.data}
                         onGetDeal={() => {}} />

          <RegisterSection
              cmsData={homeData?.sections[5]?.data}
              onRegisterSuccess={() => {}}
          />

          <ProductSection
              cmsData={homeData?.sections[6]?.data}
          />

          <Outcomes
              cmsData={homeData?.sections[7]?.data}
          />

          <Reviews
              cmsData={homeData?.sections[9]?.data}
          />

          <PricingSection
              cmsData={homeData?.sections[10]?.data}
          />

          <ContactSection
              cmsData={homeData?.sections[8]?.data}
              onSubmit={() => {}} />
        </div>
      </div>
  );
}