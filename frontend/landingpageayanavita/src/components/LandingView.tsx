import React, { useMemo, useState } from "react";
import { AyaModal } from "./AyaModal";
import "../styles/landing.css";
import logo from "../assets/aya-logo.png"; 

import type { Lang } from "../app/types";
import type {
  CmsDataByKey,
  CmsSectionKey,
  HeroData,
  AboutData,
  CardsData,
  CtaData,
  FooterData,
} from "../types/cms";

export type LandingViewProps = {
  lang: Lang;
  setLang: (l: Lang) => void;
  loading: boolean;
  error: string;
  byKey: Partial<Record<CmsSectionKey, { data: any }>> | null;
};

export default function LandingView(props: LandingViewProps) {
  const { lang, setLang, loading, error, byKey } = props;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"book" | "talk">("book");

  function openModal(which: "book" | "talk") {
    setModalTab(which);
    setModalOpen(true);
  }

  // ✅ typed getter
  const dataOf = useMemo(() => {
    return function <K extends CmsSectionKey>(key: K, fallback: CmsDataByKey[K]): CmsDataByKey[K] {
      return ((byKey?.[key]?.data ?? fallback) as CmsDataByKey[K]) ?? fallback;
    };
  }, [byKey]);

  const hero = useMemo(() => dataOf("hero", {} as HeroData), [dataOf]);
  const about = useMemo(() => dataOf("about", {} as AboutData), [dataOf]);
  const cards = useMemo(() => dataOf("cards", {} as CardsData), [dataOf]);
  const cta = useMemo(() => dataOf("cta", {} as CtaData), [dataOf]);
  const footer = useMemo(() => dataOf("footer", {} as FooterData), [dataOf]);

  const aboutTitle = about.title ?? "About AYANAVITA";
  const aboutParagraphs: string[] = Array.isArray(about.paragraphs) ? about.paragraphs : [];
  const cardItems = Array.isArray(cards.items) ? cards.items : [];

  const ctaTitle = cta.title ?? "Ready for a gentle experience?";
  const ctaBody = cta.body ?? "";
  const ctaHint = cta.hint ?? "";
  const primaryText = cta.primaryText ?? "Book a Visit";
  const secondaryText = cta.secondaryText ?? "Talk to Us";

  const brandSub =
    lang === "de"
      ? ""
      : lang === "en"
      ? ""
      : "";

  const heroSubtitle =
    hero.subtitle ??
    (lang === "de"
      ? "Ein sanftes System für Balance, Präsenz und Wohlbefinden im Alltag."
      : lang === "en"
      ? "A gentle system for balance, presence and everyday well-being."
      : "");

  const year = new Date().getFullYear();

  return (
    <>
      <div className="grain" aria-hidden="true" />

      <div className="blobs" aria-hidden="true">
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="blob b3" />
        <div className="blob b4" />
      </div>

      {/* Mobile sticky CTA */}
      <div className="sticky-cta">
        <button className="btn btn-primary" type="button" onClick={() => openModal("book")}>
          Book a Visit
        </button>
      </div>

      <header>
        <div className="wrap nav">
        <div className="brand">
        <img className="brandLogo" src={logo} alt="AYANAVITA" />
        <div>
            <span className="g-text">AYANAVITA</span>
            <small>{brandSub}</small>
        </div>
        </div>

          <nav>
            <a href="#about">About</a>
            <a href="#philosophy">Philosophy</a>
            <a href="#experience">Experience</a>
            <a href="#system">System</a>

            <a className="btn btn-aura" href="#overview">
              <span>Explore AYANAVITA</span>
            </a>

            <button className="btn btn-primary" type="button" onClick={() => openModal("book")}>
              Book a Visit
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => openModal("talk")}>
              Talk to Us
            </button>

            {/* Lang switch */}
            <div style={{ display: "inline-flex", gap: 8, marginLeft: 8 }}>
              <button className="btn btn-ghost" type="button" onClick={() => setLang("vi")} disabled={lang === "vi"}>
                VI
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => setLang("en")} disabled={lang === "en"}>
                EN
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => setLang("de")} disabled={lang === "de"}>
                DE
              </button>
            </div>
          </nav>
        </div>
      </header>

      <section className="hero" id="overview">
        <div className="wrap" style={{ position: "relative" }}>
          <span className="pill">
            <span className="dot" aria-hidden="true" />
            {hero.pill ?? "AYANAVITA • Intro"}
          </span>

          <h1 className="g-text">{hero.title ?? "AYANAVITA"}</h1>

          <p className="subtitle">{heroSubtitle}</p>

          <div className="divider">⸻</div>

          <div className="hero-actions">
            <a className="btn btn-aura" href="#about">
              <span>Explore AYANAVITA</span>
            </a>

            <button className="btn btn-primary" type="button" onClick={() => openModal("book")}>
              Book a Visit • Đặt lịch trải nghiệm
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => openModal("talk")}>
              Talk to Us • Liên hệ
            </button>
          </div>

          {loading && <div style={{ marginTop: 12, color: "rgba(15,23,42,.7)" }}>Loading CMS…</div>}
          {error && (
            <pre
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 12,
                background: "rgba(239,68,68,.10)",
                border: "1px solid rgba(239,68,68,.25)",
                overflow: "auto",
              }}
            >
              {error}
            </pre>
          )}
        </div>
      </section>

      <main>
        <section id="about">
          <div className="wrap">
            <div className="g-border">
              <div className="card about">
                <h2>
                  <span className="mark" aria-hidden="true" /> {aboutTitle}
                </h2>

                {aboutParagraphs.length > 0 ? (
                  aboutParagraphs.map((p, idx) => <p key={idx}>{p}</p>)
                ) : (
                  <>
                  </> 
                )}
              </div>
            </div>

            <div className="grid">
              {cardItems.length >= 3 ? (
                <>
                  <article className="card mini" id="philosophy">
                    <h3>{cardItems[0]?.title ?? "Our Philosophy"}</h3>
                    <p>{cardItems[0]?.desc ?? "Content updating."}</p>
                    <span className="tag">{cardItems[0]?.tag ?? "Placeholder"}</span>
                  </article>

                  <article className="card mini" id="experience">
                    <h3>{cardItems[1]?.title ?? "Our Experience"}</h3>
                    <p>{cardItems[1]?.desc ?? "Content updating."}</p>
                    <span className="tag">{cardItems[1]?.tag ?? "Placeholder"}</span>
                  </article>

                  <article className="card mini" id="system">
                    <h3>{cardItems[2]?.title ?? "Our System"}</h3>
                    <p>{cardItems[2]?.desc ?? "Content updating."}</p>
                    <span className="tag">{cardItems[2]?.tag ?? "Placeholder"}</span>
                  </article>
                </>
              ) : (
                <>
                  <article className="card mini" id="philosophy">
                    <h3>Our Philosophy</h3>
                    <p>Content updating.</p>
                    <span className="tag">Placeholder</span>
                  </article>

                  <article className="card mini" id="experience">
                    <h3>Our Experience</h3>
                    <p>Content updating.</p>
                    <span className="tag">Placeholder</span>
                  </article>

                  <article className="card mini" id="system">
                    <h3>Our System</h3>
                    <p>Content updating.</p>
                    <span className="tag">Placeholder</span>
                  </article>
                </>
              )}
            </div>

            <section style={{ marginTop: 16 }}>
              <div className="card cta">
                <h2>{ctaTitle}</h2>


                <div className="cta-actions">
                  <a className="btn btn-aura" href="#overview">
                    <span>Explore AYANAVITA (Overview)</span>
                  </a>
                  <button className="btn btn-primary" type="button" onClick={() => openModal("book")}>
                    {primaryText}
                  </button>
                  <button className="btn btn-ghost" type="button" onClick={() => openModal("talk")}>
                    {secondaryText}
                  </button>
                </div>

                <div className="hint">{ctaHint || "* Trải nghiệm hướng thư giãn & đồng hành — hoàn toàn phi y tế."}</div>
              </div>
            </section>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap footer-inner">
          <div>
            {footer.left ?? (
              <>
                © {year}{" "}
                <span className="g-text" style={{ fontWeight: 950 }}>
                  AYANAVITA
                </span>
              </>
            )}
          </div>
          <div>{footer.right ?? "Explore (primary) • Popup Book • Popup Talk"}</div>
        </div>
      </footer>

      <AyaModal
        open={modalOpen}
        initialTab={modalTab}
        onClose={() => setModalOpen(false)}
        lang={lang}
        pageSlug="landing"
      />
    </>
  );
}
