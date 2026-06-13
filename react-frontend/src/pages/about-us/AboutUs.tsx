import React, { useRef, useState, useEffect } from "react";
import { motion, useInView, type Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/shared/contexts/useTheme.js";
import { Seo } from "@/shared/seo/Seo.js";
import iconStarlex from "@/assets/icon-starlex.png";

type AboutUsProps = { variant?: "page" | "settings" };

// ─── Data ─────────────────────────────────────────────────────────────────────

const teamMembers = [
  { name: "Artem",  role: "Lead & Frontend",   github: "critiq17",  description: "Product vision, architecture decisions, and everything you see on screen." },
  { name: "Zakhar", role: "Backend Engineer",   github: "SH1roV12", description: "Go services, database modeling, and the APIs that power the product." },
  { name: "Artur",  role: "DevOps",             github: "Oget565",  description: "Infrastructure, CI/CD pipelines, and keeping the platform running." },
];

const settingsTeam = [
  { name: "Artem",  role: "Product & frontend", body: "Leads product direction, interface, and user experience." },
  { name: "Zakhar", role: "Backend",            body: "Builds the API, database model, and core task workflow." },
  { name: "Artur",  role: "DevOps",             body: "Handles infrastructure, deployment, and reliability." },
];

const values = [
  { title: "Open by default", body: "Source is public. No hidden roadmaps, no lock-in." },
  { title: "Calm tools",      body: "No clutter, no noise. Every feature earns its place." },
  { title: "Speed first",     body: "Interactions feel instant. Latency is a bug, not a cost." },
  { title: "Visible teams",   body: "Everyone sees what's happening, without asking." },
];

const changelog = [
  { date: "Mar 2026", tag: "Feature",       title: "Global search with icon picker and recents.",      body: "Find anything instantly — tasks, projects, and teams — with a keyboard-first search modal." },
  { date: "Feb 2026", tag: "Sprints",       title: "Sprint integration with velocity tracking.",        body: "Plan iterations, close sprints cleanly, and track team velocity over time." },
  { date: "Feb 2026", tag: "Collaboration", title: "Live collaboration with assignee pings.",           body: "See teammate changes the moment they happen. No refresh needed." },
  { date: "Feb 2026", tag: "Editor",        title: "Markdown editor refresh.",                          body: "Write once, preview instantly. Large task notes now feel snappy with BlockNote." },
  { date: "Dec 2025", tag: "Launch",        title: "First public release.",                             body: "Minimal, focused, and open. The foundation everything else is built on." },
];

const stats = [
  { value: "3",    label: "Developers" },
  { value: "2025", label: "Founded"    },
];

// ─── Animation variants ───────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 32, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0,  filter: "blur(0px)", transition: { duration: 0.75, ease: EASE } },
};

const containerVariants: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

// ─── SectionWrapper ───────────────────────────────────────────────────────────

function SectionWrapper({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  return (
    <motion.div ref={ref} variants={containerVariants} initial="hidden" animate={inView ? "visible" : "hidden"} className={className}>
      {children}
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AboutUs({ variant = "page" }: AboutUsProps) {
  const isSettings = variant === "settings";
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (isSettings) return;
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [isSettings]);

  if (isSettings) {
    return (
      <div className="settings-page settings-page--wide">
        <section className="settings-section">
          <div className="settings-section-header">
            <p className="settings-label">About Starlex</p>
            <h3 className="settings-section-title mt-2">Minimal task management for teams</h3>
            <p className="settings-section-description">
              Starlex helps teams organize projects, tasks, members, and updates in one focused workspace.
              It is built to stay fast, quiet, and easy to scan.
            </p>
          </div>
        </section>

        <section className="settings-section settings-section--subtle">
          <div className="settings-section-header">
            <h3 className="settings-section-title">Team</h3>
            <p className="settings-section-description">Small team, clear ownership.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {settingsTeam.map((member) => (
              <div key={member.name} className="settings-row !items-start !justify-start !flex-col">
                <div>
                  <div className="settings-row-title">{member.name}</div>
                  <div className="settings-status-pill mt-2">{member.role}</div>
                </div>
                <p className="settings-row-description">{member.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  const darkVars = theme !== "light" ? ({
    "--bg-primary":        "#0b090a",
    "--bg-secondary":      "#121011",
    "--bg-tertiary":       "#191617",
    "--bg-hover":          "#1f1b1c",
    "--text-primary":      "#f2f0ee",
    "--text-secondary":    "#c2bbb6",
    "--text-tertiary":     "#9b928c",
    "--border-color":      "#241f21",
    "--starlex-accent":    "#7c3aed",
    "--starlex-accent-rgb": "124 58 237",
    "--button-bg":         "rgba(255,255,255,0.08)",
    "--button-bg-hover":   "rgba(255,255,255,0.13)",
    "--button-bg-active":  "rgba(255,255,255,0.18)",
  } as React.CSSProperties) : undefined;

  const displayedChangelog = isSettings ? changelog.slice(0, 3) : changelog;

  return (
    <div
      className="relative font-sans bg-[color:var(--bg-primary)] text-[color:var(--text-primary)] transition-colors duration-300"
      style={isSettings ? undefined : darkVars}
    >
      {!isSettings && (
        <Seo
          title="About"
          path="/about-us"
          description="Meet the team behind Starlex and the principles that shape it: calm tools, speed-first interactions, and visible teams. Source is public by default."
        />
      )}
      {/* Star field — page only */}
      {!isSettings && (
        <div className="star-field pointer-events-none">
          {Array.from({ length: 16 }).map((_, i) => (
            <span key={i} className="star" style={{
              top: `${8 + i * 5}%`, left: `${(i * 13) % 92}%`,
              width: `${i % 3 === 0 ? 2 : 1}px`, height: `${i % 3 === 0 ? 2 : 1}px`,
              animationDelay: `${i * 0.35}s`, animationDuration: `${6 + (i % 4)}s`,
            }} />
          ))}
        </div>
      )}

      {/* Sticky navbar — page only */}
      {!isSettings && (
        <nav className={["fixed top-0 inset-x-0 z-50 transition-all duration-300", scrolled ? "backdrop-blur-md bg-[color:var(--bg-primary)]/80 shadow-sm" : "bg-transparent"].join(" ")}>
          <div className="max-w-6xl mx-auto px-6 sm:px-10 h-16 flex items-center justify-between gap-4">
            <button onClick={() => navigate("/")} className="flex items-center gap-3">
              <img src={iconStarlex} alt="Starlex logo" className="w-8 h-8 object-contain" />
              <span className="tt-font-display text-lg tracking-tight text-[color:var(--text-primary)]">Starlex</span>
            </button>
            <div className="flex items-center gap-2">
              <motion.button onClick={() => navigate("/sign-in")} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.15 }} className="tt-button">Sign In</motion.button>
              <motion.button onClick={() => navigate("/sign-up")} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.15 }} className="tt-button tt-button-primary">Sign Up</motion.button>
            </div>
          </div>
        </nav>
      )}

      <div className={isSettings ? "settings-page settings-page--wide" : "max-w-6xl mx-auto px-6 sm:px-10 relative pt-36 pb-10"}>

        {/* ── Hero ── */}
        <SectionWrapper className={isSettings ? "settings-section flex flex-col gap-4" : "flex flex-col items-center text-center gap-8 pb-20 sm:pb-28"}>
          <motion.p variants={fadeUp} className={isSettings ? "settings-label" : "text-xs uppercase tracking-[0.4em] text-[color:var(--text-secondary)]"}>About Us</motion.p>
          <motion.h1 variants={fadeUp} className={`tt-font-display leading-[1.08] max-w-4xl ${isSettings ? "text-2xl sm:text-3xl text-[color:var(--sx-text)]" : "text-5xl sm:text-6xl lg:text-7xl"}`}>
            A small team building calm, open collaboration.
          </motion.h1>
          <motion.p variants={fadeUp} className={isSettings ? "settings-section-description !mt-0 max-w-2xl" : "text-[color:var(--text-secondary)] text-lg sm:text-xl leading-relaxed max-w-2xl"}>
            Starlex is built in the open with a minimalist mindset. Simple, fast, and thoughtfully
            designed so teams stay focused on momentum — not tooling.
          </motion.p>
          {!isSettings && (
            <motion.div variants={containerVariants} className="flex flex-col sm:flex-row items-center gap-8 sm:gap-16 mt-4">
              {stats.map((stat) => (
                <motion.div key={stat.label} variants={fadeUp} className="flex flex-col items-center gap-1">
                  <span className="tt-font-display text-4xl sm:text-5xl">{stat.value}</span>
                  <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-secondary)]">{stat.label}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </SectionWrapper>

        {/* ── Values — page only ── */}
        {!isSettings && (
          <SectionWrapper className="py-16 sm:py-20">
            <motion.div variants={fadeUp} className="flex flex-col gap-2 mb-10">
              <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--text-secondary)]">What we believe</p>
              <h2 className="tt-font-display text-3xl sm:text-4xl">Values</h2>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {values.map((v) => (
                <motion.div key={v.title} variants={fadeUp} className="rounded-2xl bg-[color:var(--bg-secondary)]/80 p-7 flex flex-col gap-3 border border-[color:var(--border-color)]">
                  <span className="w-2 h-2 rounded-full" style={{ background: "var(--starlex-accent)" }} />
                  <h3 className="tt-font-display text-xl">{v.title}</h3>
                  <p className="text-sm text-[color:var(--text-secondary)] leading-relaxed">{v.body}</p>
                </motion.div>
              ))}
            </div>
          </SectionWrapper>
        )}

        {/* ── Team ── */}
        <SectionWrapper className={isSettings ? "settings-section" : "py-16 sm:py-20"}>
          <motion.div variants={fadeUp} className={isSettings ? "flex items-center justify-between gap-4 mb-5" : "flex items-center justify-between gap-4 mb-10"}>
            <div className="flex flex-col gap-2">
              <p className={isSettings ? "settings-label" : "text-xs uppercase tracking-[0.4em] text-[color:var(--text-secondary)]"}>The people</p>
              <h2 className={isSettings ? "settings-section-title" : "tt-font-display text-3xl sm:text-4xl"}>Team</h2>
            </div>
            {!isSettings && (
              <a href="https://github.com/Star1ex" target="_blank" rel="noopener noreferrer" className="tt-link text-sm shrink-0">
                Explore the org
              </a>
            )}
          </motion.div>
          <div className={isSettings ? "grid grid-cols-1 md:grid-cols-3 gap-3" : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5"}>
            {teamMembers.map((member) => (
              <motion.div key={member.github} variants={fadeUp} className={isSettings ? "settings-row !items-start !justify-start !flex-col" : "rounded-2xl bg-[color:var(--bg-secondary)]/80 p-6 flex flex-col gap-4 border border-[color:var(--border-color)]"}>
                <img src={`https://github.com/${member.github}.png`} alt={member.name} loading="lazy" decoding="async" className="size-12 rounded-full object-cover" />
                <div className="flex flex-col gap-1">
                  <div className={isSettings ? "settings-row-title" : "tt-font-display text-xl"}>{member.name}</div>
                  <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--text-secondary)]">{member.role}</div>
                </div>
                <p className={isSettings ? "settings-row-description flex-1" : "text-sm text-[color:var(--text-secondary)] leading-relaxed flex-1"}>{member.description}</p>
                <a href={`https://github.com/${member.github}`} target="_blank" rel="noopener noreferrer" className="text-sm tt-link">
                  @{member.github}
                </a>
              </motion.div>
            ))}
          </div>
        </SectionWrapper>

        {/* ── Changelog ── */}
        <SectionWrapper className={isSettings ? "settings-section" : "py-16 sm:py-20"}>
          <motion.div variants={fadeUp} className={isSettings ? "settings-section-header" : "flex flex-col gap-2 mb-10"}>
            <p className={isSettings ? "settings-label" : "text-xs uppercase tracking-[0.4em] text-[color:var(--text-secondary)]"}>Latest Updates</p>
            <h2 className={isSettings ? "settings-section-title mt-2" : "tt-font-display text-3xl sm:text-4xl"}>Changelog</h2>
          </motion.div>
          <div className={isSettings ? "flex flex-col gap-2" : "flex flex-col divide-y divide-[color:var(--border-color)]"}>
            {displayedChangelog.map((entry) => (
              <motion.div key={entry.title} variants={fadeUp} className={isSettings ? "settings-row !items-start !grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3" : "grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 sm:gap-10 py-7"}>
                <div className="flex sm:flex-col gap-3 sm:gap-2">
                  <span className="text-xs text-[color:var(--text-secondary)] tracking-wide">{entry.date}</span>
                  <span className="text-xs uppercase tracking-[0.25em] font-medium" style={{ color: "var(--starlex-accent)" }}>{entry.tag}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-base font-medium text-[color:var(--text-primary)] leading-snug">{entry.title}</h3>
                  <p className="text-sm text-[color:var(--text-secondary)] leading-relaxed">{entry.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </SectionWrapper>

        {/* ── CTA — page only ── */}
        {!isSettings && (
          <SectionWrapper className="py-20 sm:py-28 flex flex-col items-center text-center gap-8">
            <motion.h2 variants={fadeUp} className="tt-font-display text-4xl sm:text-5xl lg:text-6xl max-w-3xl">
              Ready to try it?
            </motion.h2>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-4">
              <motion.button
                onClick={() => navigate("/sign-up")}
                whileHover="hover" whileTap={{ scale: 0.97 }} initial="rest"
                className="relative overflow-hidden rounded-full bg-[color:var(--text-primary)] text-[color:var(--bg-primary)] px-8 py-3.5 text-[0.95rem] font-medium flex items-center gap-2"
              >
                <motion.span variants={{ rest: { x: 0 }, hover: { x: -3 } }} transition={{ duration: 0.2, ease: "easeOut" }}>Get started free</motion.span>
                <motion.span variants={{ rest: { x: 0, opacity: 0.6 }, hover: { x: 4, opacity: 1 } }} transition={{ duration: 0.2, ease: "easeOut" }}>→</motion.span>
                <motion.span className="absolute inset-0 bg-[color:var(--sx-rim-faint)]" variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }} transition={{ duration: 0.2 }} />
              </motion.button>
              <motion.button
                onClick={() => navigate("/")} whileTap={{ scale: 0.97 }}
                className="text-[0.95rem] font-medium text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors duration-200 underline-offset-4 hover:underline"
              >
                Back to home
              </motion.button>
            </motion.div>
          </SectionWrapper>
        )}
      </div>

      {/* ── Watermark — page only ── */}
      {!isSettings && (
        <div className="w-full overflow-hidden select-none pointer-events-none py-4">
          <motion.p
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 1.2, ease: EASE }}
            className="text-center"
            style={{ fontSize: "clamp(4rem, 18vw, 16rem)", fontFamily: '"Playfair Display", serif', letterSpacing: "-0.04em", lineHeight: 1, color: "var(--text-primary)", opacity: 0.06 }}
          >
            Starlex
          </motion.p>
        </div>
      )}

      {/* ── Footer — page only ── */}
      {!isSettings && (
        <div className="max-w-6xl mx-auto px-6 sm:px-10">
          <footer className="pt-12 pb-10">
            <div className="h-px w-full bg-[color:var(--text-primary)]/10 mb-12" />
            <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr] gap-10 mb-12">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <img src={iconStarlex} alt="Starlex logo" className="w-8 h-8 object-contain" />
                  <span className="tt-font-display text-xl">Starlex</span>
                </div>
                <p className="text-sm text-[color:var(--text-secondary)] leading-relaxed max-w-xs">Open-source task management for modern teams.</p>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-secondary)]">Support</span>
                <div className="flex flex-col gap-2 text-sm">
                  <span className="text-[color:var(--text-secondary)]">critiq17@gmail.com</span>
                  <a href="https://t.me/critiq1" target="_blank" rel="noopener noreferrer" className="tt-link">@critiq1</a>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-secondary)]">Links</span>
                <div className="flex flex-col gap-2 text-sm">
                  <button onClick={() => navigate("/")} className="tt-link text-left">Home</button>
                  <button onClick={() => navigate("/sign-in")} className="tt-link text-left">Sign In</button>
                  <button onClick={() => navigate("/sign-up")} className="tt-link text-left">Sign Up</button>
                </div>
              </div>
            </div>
            <div className="h-px w-full bg-[color:var(--text-primary)]/10 mb-6" />
            <p className="text-xs text-[color:var(--text-secondary)] text-center tracking-wide">&copy; 2026 Starlex. Open-source.</p>
          </footer>
        </div>
      )}
    </div>
  );
}
