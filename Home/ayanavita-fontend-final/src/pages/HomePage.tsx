// src/pages/HomePage.tsx
import React, { useCallback, useMemo, useState } from "react";
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
import { AuthModal } from "../components/home/AuthModal";
import { SuccessModal } from "../components/home/SuccessModal";

import { bannerSlides, partners } from "../data/home";
import { BannerSlider } from "../components/home/BannerSlider";

type AuthTab = "login" | "register";

/**
 * Nếu bạn đã có component BannerSlider thật:
 * -> Hãy tạo file: src/components/home/BannerSlider.tsx
 * -> rồi import ở đây thay cho fallback bên dưới.
 */

// ===== Fallback BannerSlider tối giản (không lỗi build) =====
export type BannerSliderProps = {
  slides?: any[];
  onAction?: (action: unknown) => void;
  intervalMs?: number;
};


export default function HomePage() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<AuthTab>("login");
  const [success, setSuccess] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

  const openAuth = useCallback((tab: AuthTab) => {
    setAuthTab(tab);
    setAuthOpen(true);
  }, []);

  const openSuccess = useCallback((message: string) => {
    setSuccess({ open: true, message });
  }, []);

  const onSlideAction = useCallback(
    (action: unknown) => {
      if (action === "OPEN_AUTH_REGISTER") openAuth("register");
    },
    [openAuth]
  );

  const marqueeItems = useMemo(() => [...partners, ...partners], []);

  return (
    <div className="bg-slate-50 text-slate-900">
      <ParticlesBackground />

      <div className="page-content">
        <Header onLogin={() => openAuth("login")} onRegister={() => openAuth("register")} />

        <TopBanner
          onConsult={() =>
            document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })
          }
        />

        <BannerSlider slides={bannerSlides} onAction={onSlideAction} />

        <Stats />

        <Partners gridItems={partners.slice(0, 6)} marqueeItems={marqueeItems} />

        <CourseGallery onGetDeal={() => openAuth("register")} />

        <RegisterSection
          onRegisterSuccess={() => openSuccess("Đăng ký thành công.")}
        />

        <ProductSection />

        <Outcomes />

        <Reviews />

        <PricingSection />

        <ContactSection onSubmit={() => openSuccess("Đã nhận yêu cầu tư vấn (prototype).")} />

        <Footer />
      </div>

      <SuccessModal
        open={success.open}
        message={success.message}
        onClose={() => setSuccess({ open: false, message: "" })}
      />

      <AuthModal
        open={authOpen}
        tab={authTab}
        onClose={() => setAuthOpen(false)}
        onSwitchTab={setAuthTab}
        onLoginSuccess={() => {
          setAuthOpen(false);
          openSuccess("Đăng nhập thành công.");
        }}
        onRegisterSuccess={() => {
          setAuthOpen(false);
          openSuccess("Đăng ký thành công.");
        }}
      />
    </div>
  );
}
