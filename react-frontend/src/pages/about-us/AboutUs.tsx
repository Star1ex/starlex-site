import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/shared/contexts/ThemeContext.js";
import iconTeamtrack from "@/assets/icon-teamtrack.png";

type AboutUsProps = {
  variant?: "page" | "settings";
};

const teamMembers = [
  { name: "Artem", role: "Lead", github: "critiq17" },
  { name: "Zakhar", role: "Backend", github: "SH1roV12" },
  { name: "Artur", role: "DevOps", github: "Oget565" },
];

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

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
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

export default function AboutUs({ variant = "page" }: AboutUsProps) {
  const isSettings = variant === "settings";
  const { theme, toggleTheme } = useTheme();
  const themeLabel =
    theme === "dark" ? "Dark Blue" : theme === "ultra-dark" ? "Ultra Dark" : theme === "solarized" ? "Solarized" : "Light";

  return (
    <div
      className={`relative font-sans bg-[color:var(--bg-primary)] text-[color:var(--text-primary)] transition-colors duration-300 ${
        isSettings ? "w-full py-6" : "min-h-screen py-10 sm:py-14"
      }`}
    >
      {!isSettings ? (
        <div className="star-field">
          {Array.from({ length: 16 }).map((_, index) => (
            <span
              key={index}
              className="star"
              style={{
                top: `${8 + index * 5}%`,
                left: `${(index * 13) % 92}%`,
                width: `${index % 3 === 0 ? 2 : 1}px`,
                height: `${index % 3 === 0 ? 2 : 1}px`,
                animationDelay: `${index * 0.35}s`,
                animationDuration: `${6 + (index % 4)}s`,
              }}
            />
          ))}
        </div>
      ) : null}

      <div className={`${isSettings ? "max-w-4xl" : "max-w-5xl"} mx-auto px-6 sm:px-10 relative`}>
        {!isSettings ? (
          <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between mb-12">
            <div className="flex items-center gap-3">
              <img src={iconTeamtrack} alt="TeamTrack" className="w-9 h-9 object-contain" />
              <div className="text-sm tracking-[0.2em] uppercase text-[color:var(--text-secondary)]">TeamTrack</div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={toggleTheme} className="tt-button text-xs uppercase tracking-[0.3em]">
                {themeLabel}
              </button>
              <a href="/" className="tt-button">
                Back Home
              </a>
              <a href="https://github.com/Team-Tracks" target="_blank" rel="noopener noreferrer" className="tt-button">
                GitHub Org
              </a>
            </div>
          </header>
        ) : null}

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={fadeUp}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`${isSettings ? "text-center" : ""}`}
        >
          <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--text-secondary)]">About Us</p>
          <h1 className="tt-font-display mt-6 text-4xl sm:text-5xl leading-tight">
            A small team focused on calm, open collaboration.
          </h1>
          <p className="mt-6 text-[color:var(--text-secondary)] max-w-2xl mx-auto">
            TeamTrack is built in the open with a minimalist mindset. We keep the product simple, fast, and thoughtfully
            designed so teams can focus on momentum.
          </p>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          className="mt-14 sm:mt-20"
        >
          <motion.div variants={fadeUp} className="flex items-center justify-between gap-4 mb-8">
            <h2 className="tt-font-display text-2xl sm:text-3xl">Team</h2>
            {!isSettings ? (
              <a href="https://github.com/Team-Tracks" target="_blank" rel="noopener noreferrer" className="tt-link text-sm">
                Explore the org
              </a>
            ) : null}
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 w-full items-stretch">
            {teamMembers.map((member) => (
              <motion.div
                key={member.github}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="rounded-2xl bg-[color:var(--bg-secondary)]/80 p-6 text-left h-full w-full"
              >
                <img
                  src={`https://github.com/${member.github}.png`}
                  alt={member.name}
                  loading="lazy"
                  decoding="async"
                  className="w-14 h-14 rounded-full object-cover mb-4"
                />
                <div className="tt-font-display text-xl">{member.name}</div>
                <div className="text-sm text-[color:var(--text-secondary)] mt-1">{member.role}</div>
                <a
                  href={`https://github.com/${member.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex mt-4 text-sm tt-link"
                >
                  @{member.github}
                </a>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          className="mt-16 sm:mt-24"
        >
          <motion.div variants={fadeUp} className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--text-secondary)]">Latest Updates</p>
            <h2 className="tt-font-display text-2xl sm:text-3xl">Changelog</h2>
          </motion.div>
          <div className="mt-8 space-y-8">
            {updates.map((update, index) => (
              <motion.div key={update.title} variants={fadeUp} transition={{ duration: 0.5, delay: index * 0.05 }}>
                <div className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-secondary)] flex flex-wrap gap-3">
                  <span>{update.date}</span>
                  <span>{update.tag}</span>
                </div>
                <h3 className="mt-3 text-lg text-[color:var(--text-primary)]">{update.title}</h3>
                <p className="mt-2 text-[color:var(--text-secondary)] max-w-2xl">{update.body}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
