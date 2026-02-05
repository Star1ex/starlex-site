import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { isAuthenticated } from "@/shared/lib/authManager.js";
import { useTheme } from "@/shared/contexts/ThemeContext.js";
import iconTeamtrack from "@/assets/icon-teamtrack.png";
import editorShotOne from "@/assets/s.png";
import editorShotTwo from "@/assets/s.png";

export const HomePage = () => {
  const navigate = useNavigate();
  const authed = isAuthenticated();
  const { theme, toggleTheme } = useTheme();

  const themeLabel =
    theme === "dark" ? "Dark Blue" : theme === "ultra-dark" ? "Ultra Dark" : theme === "solarized" ? "Solarized" : "Light";

  const updates = [
    {
      date: "Feb 4, 2026",
      title: "Live collaboration now includes assignee and status pings.",
      body: "Reduce context switching with inline updates and instant teammate visibility.",
      tag: "Collaboration",
    },
    {
      date: "Feb 1, 2026",
      title: "Markdown editor refresh with faster rendering.",
      body: "Write once, preview instantly. Large task notes now feel snappy.",
      tag: "Markdown",
    },
    {
      date: "Dec 10, 2025",
      title: "Published first release.",
      body: "Minimal functionality for core features.",
      tag: "Launch",
    },
  ];

  const stars = [
    { top: "8%", left: "6%", size: 2, delay: "0s", duration: "6s" },
    { top: "14%", left: "22%", size: 1, delay: "1s", duration: "7s" },
    { top: "20%", left: "45%", size: 2, delay: "2s", duration: "8s" },
    { top: "12%", left: "70%", size: 1, delay: "0.5s", duration: "6.5s" },
    { top: "26%", left: "82%", size: 2, delay: "1.6s", duration: "7.5s" },
    { top: "32%", left: "12%", size: 1, delay: "2.4s", duration: "8.2s" },
    { top: "38%", left: "30%", size: 2, delay: "0.8s", duration: "6.8s" },
    { top: "42%", left: "56%", size: 1, delay: "1.2s", duration: "7.2s" },
    { top: "46%", left: "76%", size: 2, delay: "2.1s", duration: "8.4s" },
    { top: "52%", left: "8%", size: 1, delay: "0.3s", duration: "6.4s" },
    { top: "58%", left: "24%", size: 2, delay: "1.9s", duration: "7.8s" },
    { top: "60%", left: "48%", size: 1, delay: "2.7s", duration: "8.6s" },
    { top: "64%", left: "68%", size: 2, delay: "1.4s", duration: "7.4s" },
    { top: "70%", left: "88%", size: 1, delay: "0.9s", duration: "6.9s" },
    { top: "74%", left: "36%", size: 2, delay: "2.3s", duration: "8.1s" },
    { top: "80%", left: "58%", size: 1, delay: "1.1s", duration: "7.1s" },
    { top: "84%", left: "16%", size: 2, delay: "2.6s", duration: "8.3s" },
    { top: "88%", left: "72%", size: 1, delay: "0.6s", duration: "6.6s" },
    { top: "92%", left: "42%", size: 2, delay: "1.8s", duration: "7.9s" },
    { top: "18%", left: "92%", size: 1, delay: "2.2s", duration: "8.5s" },
    { top: "28%", left: "60%", size: 2, delay: "1.7s", duration: "7.7s" },
    { top: "36%", left: "90%", size: 1, delay: "0.4s", duration: "6.2s" },
    { top: "48%", left: "40%", size: 2, delay: "2.8s", duration: "8.7s" },
    { top: "54%", left: "78%", size: 1, delay: "1.3s", duration: "7.3s" },
    { top: "66%", left: "94%", size: 2, delay: "2s", duration: "8s" },
  ];

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
  };

  const stagger = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  return (
    <div className="relative min-h-screen font-sans bg-[color:var(--bg-primary)] text-[color:var(--text-primary)] transition-colors duration-300">
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(1200px 600px at 15% -10%, rgba(59, 130, 246, 0.18), transparent 60%), radial-gradient(900px 500px at 85% 10%, rgba(14, 165, 233, 0.12), transparent 55%)",
          }}
        />
        <div className="star-field">
          {stars.map((star, index) => (
            <span
              key={index}
              className="star"
              style={{
                top: star.top,
                left: star.left,
                width: `${star.size}px`,
                height: `${star.size}px`,
                animationDelay: star.delay,
                animationDuration: star.duration,
              }}
            />
          ))}
        </div>

        <div className="relative max-w-6xl mx-auto px-6 sm:px-10 py-10 sm:py-14">
          <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <img src={iconTeamtrack} alt="TeamTrack" className="w-9 h-9 object-contain" />
              <div className="text-sm tracking-[0.2em] uppercase text-[color:var(--text-secondary)]">TeamTrack</div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button onClick={toggleTheme} className="tt-button text-xs uppercase tracking-[0.3em]">
                {themeLabel}
              </button>
              {authed ? (
                <button onClick={() => navigate("/dashboard")} className="tt-button">
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <button onClick={() => navigate("/sign-in")} className="tt-button">
                    Sign In
                  </button>
                  <button onClick={() => navigate("/sign-up")} className="tt-button">
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </header>

          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={fadeUp}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mt-16 sm:mt-24"
          >
            <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--text-secondary)]">
              Open-source • Markdown • Collaboration
            </p>
            <h1 className="tt-font-display mt-6 text-4xl sm:text-5xl md:text-6xl leading-tight">
              Calm focus for teams that write their work down.
            </h1>
            <p className="mt-6 text-base sm:text-lg text-[color:var(--text-secondary)] leading-relaxed max-w-2xl">
              TeamTrack is a minimalist workspace built for fast Markdown notes, effortless assignment, and shared momentum.
              Keep your team aligned without the noise.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={authed ? () => navigate("/dashboard") : () => navigate("/sign-in")}
                className="tt-button tt-button-primary"
              >
                {authed ? "Open Dashboard" : "Get Started"}
              </button>
              <a
                href="https://github.com/Team-Tracks"
                target="_blank"
                rel="noopener noreferrer"
                className="tt-button"
              >
                View GitHub
              </a>
            </div>
          </motion.section>

          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="mt-20 sm:mt-28 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]"
          >
            <motion.div variants={fadeUp}>
              <h2 className="tt-font-display text-3xl sm:text-4xl leading-tight">
                Everything your team needs to stay in rhythm.
              </h2>
              <p className="mt-4 text-[color:var(--text-secondary)] leading-relaxed">
                Minimal structure, maximum clarity. Organize tasks, update progress, and keep context in Markdown without
                changing the way your team already works.
              </p>
              <div className="mt-8 space-y-5 text-sm text-[color:var(--text-secondary)]">
                {[
                  "Shared boards with instant updates across teams.",
                  "Markdown-first editor that feels fast and familiar.",
                  "Thoughtful notifications and activity clarity.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-2 h-1.5 w-1.5 rounded-full bg-[color:var(--accent-blue)]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="space-y-6 text-sm text-[color:var(--text-secondary)]">
              <div className="tt-font-display text-2xl sm:text-3xl text-[color:var(--text-primary)]">
                Built for calm, crafted for momentum.
              </div>
              <p>
                TeamTrack is open-source, fast to self-host, and designed to feel invisible while your team ships.
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => navigate("/sign-up")} className="tt-button">
                  Start free
                </button>
                <button onClick={() => navigate("/about-us")} className="tt-button">
                  About Us
                </button>
              </div>
            </motion.div>
          </motion.section>

          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={stagger}
            className="mt-24 sm:mt-32"
          >
            <motion.div variants={fadeUp} className="flex flex-col gap-4 mb-10">
              <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--text-secondary)]">Editor Showcase</p>
              <h2 className="tt-font-display text-3xl sm:text-4xl">
                A workspace that feels light and deliberate.
              </h2>
              <p className="text-[color:var(--text-secondary)] max-w-2xl">
                Drop in your own editor screenshots here. Each image fades in softly as you scroll.
              </p>
            </motion.div>

            <div className="grid gap-8 lg:grid-cols-2">
              {[editorShotOne, editorShotTwo].map((shot, index) => (
                <motion.div
                  key={index}
                  variants={fadeUp}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="relative"
                >
                  <img
                    src={shot}
                    alt={`TeamTrack editor preview ${index + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full rounded-2xl shadow-[0_30px_80px_rgba(15,23,42,0.18)] dark:shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="mt-24 sm:mt-32"
          >
            <motion.div variants={fadeUp} className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--text-secondary)]">Updates</p>
              <h2 className="tt-font-display text-3xl sm:text-4xl">Latest changes from the team.</h2>
            </motion.div>
            <div className="mt-10 space-y-8">
              {updates.map((update, index) => (
                <motion.div key={update.title} variants={fadeUp} transition={{ duration: 0.5, delay: index * 0.05 }}>
                  <div className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-secondary)] flex flex-wrap gap-3">
                    <span>{update.date}</span>
                    <span>{update.tag}</span>
                  </div>
                  <h3 className="mt-3 text-lg sm:text-xl text-[color:var(--text-primary)]">{update.title}</h3>
                  <p className="mt-2 text-[color:var(--text-secondary)] max-w-2xl">{update.body}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <footer className="relative mt-24 sm:mt-32 pb-12">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[color:var(--text-secondary)]/30 to-transparent mb-10" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="tt-font-display text-[clamp(3rem,12vw,8rem)] text-[color:var(--text-primary)] opacity-[0.08]">
                TeamTrack
              </div>
            </div>
            <div className="relative grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
              <div>
                <div className="tt-font-display text-2xl">TeamTrack</div>
                <p className="mt-3 text-sm text-[color:var(--text-secondary)] max-w-sm">
                  Open-source collaboration for teams that live in Markdown.
                </p>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-secondary)] mb-4">Support</div>
                <div className="space-y-3 text-sm">
                  <div className="text-[color:var(--text-secondary)]">critiq17@gmail.com</div>
                  <a href="https://t.me/critiq1" className="tt-link">
                    @critiq1
                  </a>
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-secondary)] mb-4">Links</div>
                <div className="space-y-3 text-sm">
                  <a href="https://github.com/Team-Tracks" target="_blank" rel="noopener noreferrer" className="tt-link">
                    GitHub Organization
                  </a>
                  <a href="/about-us" className="tt-link">
                    About Us
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
