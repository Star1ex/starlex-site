import React, { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence, type Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "@/shared/lib/authManager.js";
import { useSystemThemeOnly, useTheme } from "@/shared/contexts/useTheme.js";
import iconStarlex from "@/assets/icon-starlex.png";
import { Helmet } from "react-helmet-async";
import markdownDark from "@/public/MarkdownSupportBlackTheme.mp4";
import markdownLight from "@/public/MarkdownSupportWhiteTheme.mp4";
import collabDark from "@/public/TeamCollaborationDark.mp4";
import collabLight from "@/public/TeamCollaborationWhite.mp4";

// ─── Animation variants ───────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.75, ease: EASE } },
};

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const slideLeft: Variants = {
  hidden: { opacity: 0, x: -48, filter: "blur(4px)" },
  visible: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: EASE } },
};

const slideRight: Variants = {
  hidden: { opacity: 0, x: 48, filter: "blur(4px)" },
  visible: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: EASE } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92, filter: "blur(6px)" },
  visible: { opacity: 1, scale: 1, filter: "blur(0px)", transition: { duration: 0.7, ease: EASE } },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ImagePlaceholderProps {
  label?: string;
}

function ImagePlaceholder({ label = "Screenshot coming soon" }: ImagePlaceholderProps) {
  return (
    <div className="w-full aspect-video min-h-[240px] rounded-2xl bg-[color:var(--bg-tertiary)] flex items-center justify-center">
      <span className="text-[color:var(--text-secondary)] text-sm">{label}</span>
    </div>
  );
}

interface VideoPlaceholderProps {
  label?: string;
  onClick?: () => void;
}

function VideoPlaceholder({ label, onClick }: VideoPlaceholderProps) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`w-full aspect-video min-h-[240px] rounded-2xl bg-[color:var(--bg-secondary)] flex items-center justify-center relative overflow-hidden ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-[color:var(--text-primary)]/10 flex items-center justify-center">
          <div className="w-0 h-0 border-y-8 border-y-transparent border-l-[14px] border-l-[color:var(--text-primary)] ml-1" />
        </div>
        {label && (
          <span className="text-xs text-[color:var(--text-secondary)] tracking-wider uppercase">
            {label}
          </span>
        )}
      </div>
    </motion.div>
  );
}

function ThemedVideo({ src }: { src: string }) {
  return (
    <div className="w-full aspect-video min-h-[240px] rounded-2xl overflow-hidden bg-[color:var(--bg-secondary)]">
      <video
        key={src}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
      />
    </div>
  );
}

interface FeatureSectionProps {
  title: string;
  body: string;
  bullets: string[];
  mediaType: "image" | "video";
  mediaPosition: "left" | "right";
  videoLabel?: string;
  videoSrc?: string;
  onVideoClick?: () => void;
}

function FeatureSection({
  title,
  body,
  bullets,
  mediaType,
  mediaPosition,
  videoLabel,
  videoSrc,
  onVideoClick,
}: FeatureSectionProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });

  const textBlock = (
    <motion.div
      variants={mediaPosition === "right" ? slideLeft : slideRight}
      className="flex flex-col justify-center gap-6"
    >
      <h2 className="tt-font-display text-3xl sm:text-4xl lg:text-5xl leading-tight text-[color:var(--text-primary)]">
        {title}
      </h2>
      <p className="text-[color:var(--text-secondary)] leading-relaxed text-base sm:text-lg">{body}</p>
      <ul className="space-y-3">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-3 text-sm text-[color:var(--text-secondary)]">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[color:var(--starlex-accent)] shrink-0" />
            {bullet}
          </li>
        ))}
      </ul>
    </motion.div>
  );

  const mediaBlock = (
    <motion.div variants={mediaPosition === "right" ? slideRight : slideLeft}>
      {videoSrc ? (
        <ThemedVideo src={videoSrc} />
      ) : mediaType === "image" ? (
        <ImagePlaceholder />
      ) : (
        <VideoPlaceholder label={videoLabel} onClick={onVideoClick} />
      )}
    </motion.div>
  );

  return (
    <motion.section
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center py-20 sm:py-28"
    >
      {mediaPosition === "left" ? (
        <>
          {mediaBlock}
          {textBlock}
        </>
      ) : (
        <>
          {textBlock}
          {mediaBlock}
        </>
      )}
    </motion.section>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export const HomePage = () => {
  useSystemThemeOnly();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const authed = isAuthenticated();
  const [scrolled, setScrolled] = useState(false);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const videoRef = useRef(null);
  const videoInView = useInView(videoRef, { once: true, amount: 0.15 });


  const ctaRef = useRef(null);
  const ctaInView = useInView(ctaRef, { once: true, amount: 0.3 });

  useEffect(() => {
    if (authed) {
      const redirectPath = localStorage.getItem('redirectPath') || '/dashboard';
      localStorage.removeItem('redirectPath');
      navigate(redirectPath, { replace: true });
    }
  }, [authed, navigate]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const featureSections: FeatureSectionProps[] = [
    {
      title: "Organize work the way your team thinks",
      body: "Kanban boards built for the way modern teams operate — visual, fast, and always up to date.",
      bullets: [
        "Drag-and-drop task management across status columns",
        "Priority levels so everyone knows what ships first",
        "Status tracking that gives the full picture at a glance",
      ],
      mediaType: "image",
      mediaPosition: "right",
    },
    {
      title: "Ship in sprints, not chaos",
      body: "Plan your sprints with confidence, track velocity over time, and close iterations with clarity.",
      bullets: [
        "Sprint planning with time-boxed iteration goals",
        "Velocity tracking across every sprint",
        "Clean sprint close — archive done, surface what remains",
      ],
      mediaType: "video",
      mediaPosition: "left",
      videoLabel: "Sprint Planning",
    },
    {
      title: "Write rich context, not just titles",
      body: "Every task deserves more than a one-liner. BlockNote-powered editor brings full Markdown and rich text to your workflow.",
      bullets: [
        "Full Markdown support with live preview",
        "Rich text blocks: headings, code, lists, embeds",
        "Feels like writing in a document, not a ticket field",
      ],
      mediaType: "image",
      mediaPosition: "right",
      videoSrc: theme !== "light" ? markdownDark : markdownLight,
    },
    {
      title: "Your team, always in sync",
      body: "Real-time updates mean no one is ever working from a stale view. See who's doing what, the moment it changes.",
      bullets: [
        "Live task updates across all connected sessions",
        "Assignees, comments, and team visibility in one place",
        "Activity feed that keeps everyone aware without noise",
      ],
      mediaType: "video",
      mediaPosition: "left",
      videoSrc: theme !== "light" ? collabDark : collabLight,
    },
  ];


  const videoShowcaseItems = [
    "Task Management",
    "Sprint Planning",
    "Team Collaboration",
    "Markdown Editor",
  ];

  return (
    <div
      className="relative min-h-screen font-sans bg-[color:var(--bg-primary)] text-[color:var(--text-primary)] transition-colors duration-300"
      style={theme !== "light" ? {
        "--bg-primary": "#0b090a",
        "--bg-secondary": "#121011",
        "--bg-tertiary": "#191617",
        "--bg-hover": "#1f1b1c",
        "--bg-active": "#272123",
        "--text-primary": "#f2f0ee",
        "--text-secondary": "#c2bbb6",
        "--text-tertiary": "#9b928c",
        "--border-color": "#241f21",
        "--starlex-accent": "#7c3aed",
        "--starlex-accent-rgb": "124 58 237",
        "--button-bg": "rgba(255,255,255,0.08)",
        "--button-bg-hover": "rgba(255,255,255,0.13)",
        "--button-bg-active": "rgba(255,255,255,0.18)",
      } as React.CSSProperties : undefined}
    >
      <Helmet>
        <title>Starlex — Task Management for Modern Teams</title>
        <meta
          name="description"
          content="Organize tasks, run sprints, and collaborate with your team in real time. Free for teams of up to 5."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://starlex.cc/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Starlex — Task Management for Modern Teams" />
        <meta property="og:description" content="Organize tasks, run sprints, and collaborate with your team in real time." />
        <meta property="og:image" content="https://starlex.cc/og-image.png" />
        <meta property="og:url" content="https://starlex.cc/" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Starlex",
            applicationCategory: "ProjectManagement",
            operatingSystem: "Web",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            description: "Task management with sprints, projects, and real-time collaboration.",
            url: "https://starlex.cc",
          })}
        </script>
      </Helmet>

      {/* Video modal */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12 bg-[color:var(--bg-primary)]/80 backdrop-blur-xl"
            onClick={() => setActiveVideo(null)}
          >
            <motion.div
              key="modal-content"
              initial={{ scale: 0.85, opacity: 0, filter: "blur(12px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              exit={{ scale: 0.9, opacity: 0, filter: "blur(8px)" }}
              transition={{ duration: 0.4, ease: EASE }}
              className="w-full max-w-4xl aspect-video rounded-2xl bg-[color:var(--bg-secondary)] flex items-center justify-center overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center gap-4 text-[color:var(--text-secondary)]">
                <div className="w-20 h-20 rounded-full bg-[color:var(--text-primary)]/8 flex items-center justify-center">
                  <div className="w-0 h-0 border-y-[10px] border-y-transparent border-l-[18px] border-l-[color:var(--text-primary)] ml-1.5" />
                </div>
                <span className="text-sm tracking-wider uppercase">{activeVideo}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky navbar */}
      <nav
        className={[
          "fixed top-0 inset-x-0 z-50 transition-all duration-300",
          scrolled
            ? "backdrop-blur-md bg-[color:var(--bg-primary)]/80 shadow-sm"
            : "bg-transparent",
        ].join(" ")}
      >
        <div className="max-w-6xl mx-auto px-6 sm:px-10 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={iconStarlex} alt="Starlex logo" className="w-8 h-8 object-contain" />
            <span className="tt-font-display text-lg tracking-tight text-[color:var(--text-primary)]">
              Starlex
            </span>
          </div>

          <div className="flex items-center gap-2">
            {authed ? (
              <motion.button
                onClick={() => navigate("/dashboard")}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="tt-button"
              >
                Go to Dashboard
              </motion.button>
            ) : (
              <>
                <motion.button
                  onClick={() => navigate("/sign-in")}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="tt-button"
                >
                  Sign In
                </motion.button>
                <motion.button
                  onClick={() => navigate("/sign-up")}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="tt-button tt-button-primary"
                >
                  Sign Up
                </motion.button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10">
        {/* ── Hero ── */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="pt-40 pb-20 sm:pt-52 sm:pb-28 flex flex-col items-center text-center gap-8"
        >

          <motion.h1
            variants={fadeUp}
            className="tt-font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.08] max-w-4xl"
          >
            The task manager your team will actually use.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-[color:var(--text-secondary)] text-lg sm:text-xl leading-relaxed max-w-2xl"
          >
            Starlex brings together tasks, sprints, and rich Markdown notes — so your team
            stays aligned without switching tools.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-4">
            <motion.button
              onClick={authed ? () => navigate("/dashboard") : () => navigate("/sign-in")}
              whileHover="hover"
              whileTap={{ scale: 0.97 }}
              initial="rest"
              className="group relative overflow-hidden rounded-full bg-[color:var(--text-primary)] text-[color:var(--bg-primary)] px-8 py-3.5 text-[0.95rem] font-medium flex items-center gap-2"
              style={{ boxShadow: "0 0 0 0 transparent" }}
            >
              <motion.span
                variants={{ rest: { x: 0 }, hover: { x: -3 } }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {authed ? "Open Dashboard" : "Get Started"}
              </motion.span>
              <motion.span
                variants={{ rest: { x: 0, opacity: 0.6 }, hover: { x: 4, opacity: 1 } }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                →
              </motion.span>
              <motion.span
                className="absolute inset-0 bg-[color:var(--sx-rim-faint)]"
                variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
                transition={{ duration: 0.2 }}
              />
            </motion.button>

            <motion.button
              onClick={() => setActiveVideo("Task Management")}
              whileHover="hover"
              whileTap={{ scale: 0.97 }}
              initial="rest"
              className="group flex items-center gap-2.5 px-6 py-3.5 text-[0.95rem] font-medium text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors duration-200"
            >
              <motion.span
                className="w-8 h-8 rounded-full border border-[color:var(--text-primary)]/20 flex items-center justify-center"
                variants={{ rest: { scale: 1 }, hover: { scale: 1.1, borderColor: "var(--text-primary)" } }}
                transition={{ duration: 0.2 }}
              >
                <span className="w-0 h-0 border-y-[5px] border-y-transparent border-l-[9px] border-l-current ml-0.5" />
              </motion.span>
              Watch demo
            </motion.button>
          </motion.div>
        </motion.section>

        {/* ── Feature scroll sections ── */}
        <div className="divide-y-0">
          {featureSections.map((section) => (
            <FeatureSection
              key={section.title}
              {...section}
              onVideoClick={
                section.mediaType === "video"
                  ? () => setActiveVideo(section.videoLabel ?? section.title)
                  : undefined
              }
            />
          ))}
        </div>

        {/* ── Video showcase ── */}
        <motion.section
          ref={videoRef}
          variants={containerVariants}
          initial="hidden"
          animate={videoInView ? "visible" : "hidden"}
          className="py-20 sm:py-28"
        >
          <motion.div variants={fadeUp} className="text-center mb-14">
            <h2 className="tt-font-display text-4xl sm:text-5xl lg:text-6xl">
              See Starlex in action
            </h2>
            <p className="mt-4 text-[color:var(--text-secondary)] text-lg">
              Short walkthroughs of every core feature.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            {videoShowcaseItems.map((label) => (
              <motion.div key={label} variants={fadeUp}>
                <VideoPlaceholder label={label} onClick={() => setActiveVideo(label)} />
                <p className="mt-3 text-center text-sm text-[color:var(--text-secondary)] tracking-wide">
                  {label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>


        {/* ── CTA ── */}
        <motion.section
          ref={ctaRef}
          variants={containerVariants}
          initial="hidden"
          animate={ctaInView ? "visible" : "hidden"}
          className="py-20 sm:py-28 text-center flex flex-col items-center gap-8"
        >
          <motion.h2
            variants={scaleIn}
            className="tt-font-display text-4xl sm:text-5xl lg:text-6xl max-w-3xl"
          >
            Ready to bring your team together?
          </motion.h2>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-4">
            <motion.button
              onClick={() => navigate("/sign-up")}
              whileHover="hover"
              whileTap={{ scale: 0.97 }}
              initial="rest"
              className="relative overflow-hidden rounded-full bg-[color:var(--text-primary)] text-[color:var(--bg-primary)] px-8 py-3.5 text-[0.95rem] font-medium flex items-center gap-2"
            >
              <motion.span
                variants={{ rest: { x: 0 }, hover: { x: -3 } }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                Start for free
              </motion.span>
              <motion.span
                variants={{ rest: { x: 0, opacity: 0.6 }, hover: { x: 4, opacity: 1 } }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                →
              </motion.span>
              <motion.span
                className="absolute inset-0 bg-[color:var(--sx-rim-faint)]"
                variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
                transition={{ duration: 0.2 }}
              />
            </motion.button>
            <motion.button
              onClick={() => navigate("/about-us")}
              className="text-[0.95rem] font-medium text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors duration-200 underline-offset-4 hover:underline"
              whileTap={{ scale: 0.97 }}
            >
              About the team
            </motion.button>
          </motion.div>
        </motion.section>
      </div>

      {/* ── Full-width watermark ── */}
      <div className="w-full overflow-hidden select-none pointer-events-none py-4">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: EASE }}
          className="text-center"
          style={{
            fontSize: "clamp(4rem, 18vw, 16rem)",
            fontFamily: '"Playfair Display", serif',
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: "var(--text-primary)",
            opacity: 0.06,
          }}
        >
          Starlex
        </motion.p>
      </div>

      {/* ── Footer ── */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10">
        <footer className="pt-12 pb-10">
          <div className="h-px w-full bg-[color:var(--text-primary)]/10 mb-12" />

          <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr] gap-10 mb-12">
            {/* Brand */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <img src={iconStarlex} alt="Starlex logo" className="w-8 h-8 object-contain" />
                <span className="tt-font-display text-xl text-[color:var(--text-primary)]">
                  Starlex
                </span>
              </div>
              <p className="text-sm text-[color:var(--text-secondary)] leading-relaxed max-w-xs">
                Open-source task management for modern teams.
              </p>
            </div>

            {/* Support */}
            <div className="flex flex-col gap-4">
              <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-secondary)]">
                Support
              </span>
              <div className="flex flex-col gap-2 text-sm">
                <span className="text-[color:var(--text-secondary)]">critiq17@gmail.com</span>
                <a
                  href="https://t.me/critiq1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tt-link"
                >
                  @critiq1
                </a>
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-col gap-4">
              <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-secondary)]">
                Links
              </span>
              <div className="flex flex-col gap-2 text-sm">
                <button
                  onClick={() => navigate("/about-us")}
                  className="tt-link text-left"
                >
                  About Us
                </button>
                <button
                  onClick={() => navigate("/sign-in")}
                  className="tt-link text-left"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate("/sign-up")}
                  className="tt-link text-left"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-[color:var(--text-primary)]/10 mb-6" />
          <p className="text-xs text-[color:var(--text-secondary)] text-center tracking-wide">
            &copy; 2026 Starlex. Open-source.
          </p>
        </footer>
      </div>
    </div>
  );
};
