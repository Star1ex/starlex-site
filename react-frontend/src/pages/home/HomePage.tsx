import React from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "@/shared/lib/authManager.js";
import iconTeamtrack from "@/assets/icon-teamtrack.png";

export const HomePage = () => {
  const navigate = useNavigate();
  const authed = isAuthenticated();

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

  const handleGetStarted = () => {
    navigate("/sign-in");
  };

  return (
    <div
      className="min-h-screen bg-white dark:bg-dark-bg transition-colors duration-300"
      style={{ fontFamily: '"DM Sans", "Manrope", "Plus Jakarta Sans", system-ui, sans-serif' }}
    >
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.03),transparent_45%),linear-gradient(90deg,rgba(15,23,42,0.03),transparent_45%)]" />
        <div className="relative max-w-6xl mx-auto px-6 sm:px-10 pt-10 sm:pt-14 pb-20">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={iconTeamtrack} alt="TeamTrack" className="w-9 h-9 object-contain" />
              <div className="text-sm text-gray-600 dark:text-dark-text-muted tracking-wide font-medium">TeamTrack</div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto text-sm">
              {authed ? (
                <button
                  onClick={() => navigate("/dashboard")}
                  className="text-gray-900 dark:text-dark-text underline underline-offset-4 decoration-gray-300 dark:decoration-dark-border hover:decoration-gray-500 transition-colors w-full sm:w-auto text-left"
                >
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate("/sign-in")}
                    className="text-gray-900 dark:text-dark-text underline underline-offset-4 decoration-gray-300 dark:decoration-dark-border hover:decoration-gray-500 transition-colors w-full sm:w-auto text-left"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate("/sign-up")}
                    className="text-gray-900 dark:text-dark-text underline underline-offset-4 decoration-gray-300 dark:decoration-dark-border hover:decoration-gray-500 transition-colors w-full sm:w-auto text-left"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </header>

          <div className="mt-10 h-px w-full bg-gradient-to-r from-transparent via-gray-200/70 to-transparent dark:via-dark-border/60" />

          <section className="mt-12">
            <div className="text-xs uppercase tracking-[0.3em] text-gray-400 dark:text-dark-text-muted">
              Open-source • Markdown • Collaboration
            </div>
            <h1 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-medium text-gray-900 dark:text-dark-text leading-tight">
              A calm, open workspace for Markdown-driven teamwork.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-gray-600 dark:text-dark-text-muted leading-relaxed max-w-2xl">
              TeamTrack is an open-source task hub built for collaboration. Capture rich Markdown notes, assign work in
              seconds, and keep every teammate in sync with instant status updates and lightweight shared boards.
            </p>

            <div className="mt-8 space-y-5 text-sm text-gray-700 dark:text-dark-text-muted">
              {[
                "Open-source by default with transparent roadmaps.",
                "Markdown editor with fast preview and shortcuts.",
                "Live collaboration across teams and personal spaces.",
                "Granular updates that keep payloads light.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-4">
                  <div className="mt-2 h-px w-10 bg-gray-300/80 dark:bg-dark-border/70" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-4 text-sm">
              <button
                onClick={authed ? () => navigate("/dashboard") : handleGetStarted}
                className="text-gray-900 dark:text-dark-text underline underline-offset-4 decoration-gray-300 dark:decoration-dark-border hover:decoration-gray-500 transition-colors w-full sm:w-auto text-left"
              >
                {authed ? "Open Dashboard" : "Get Started"}
              </button>
              <a
                href="https://github.com/Team-Tracks"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-900 dark:text-dark-text underline underline-offset-4 decoration-gray-300 dark:decoration-dark-border hover:decoration-gray-500 transition-colors w-full sm:w-auto text-left"
              >
                View Repository
              </a>
              <a
                href="https://t.me/critiq1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-900 dark:text-dark-text underline underline-offset-4 decoration-gray-300 dark:decoration-dark-border hover:decoration-gray-500 transition-colors w-full sm:w-auto text-left"
              >
                Community Channel
              </a>
            </div>
          </section>

          <section className="mt-16 grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Structure without noise",
                body: "Folders, subfolders, and tasks stay tidy with instant creation, quick rename, and clean lists.",
              },
              {
                title: "Progress you can trust",
                body: "Priority and status updates sync immediately so every teammate sees the same source of truth.",
              },
              {
                title: "Open by default",
                body: "Self-host or contribute. Every feature is built with transparency and community feedback.",
              },
            ].map((card) => (
              <div key={card.title}>
                <div className="h-px w-full bg-gray-200/70 dark:bg-dark-border/60 mb-4" />
                <h3 className="text-base font-medium text-gray-900 dark:text-dark-text mb-2">{card.title}</h3>
                <p className="text-sm text-gray-600 dark:text-dark-text-muted leading-relaxed">{card.body}</p>
              </div>
            ))}
          </section>

          <section className="mt-20">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-gray-400 dark:text-dark-text-muted mb-2">Changelog</p>
                <h2 className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-dark-text">
                  Recent updates from the team.
                </h2>
              </div>
              <div className="text-sm text-gray-500 dark:text-dark-text-muted">
                A snapshot of what’s shipping lately.
              </div>
            </div>
            <div className="space-y-6">
              {updates.map((update, index) => (
                <div key={update.title} className="text-sm">
                  <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-dark-text-muted">
                    <span>{update.date}</span>
                    <span className="text-gray-500 dark:text-dark-text-muted">{update.tag}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-dark-text">
                    {update.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-dark-text-muted leading-relaxed max-w-2xl">
                    {update.body}
                  </p>
                  {index < updates.length - 1 ? (
                    <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-gray-200/70 to-transparent dark:via-dark-border/60" />
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <footer className="mt-20 pt-8 pb-12">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200/70 to-transparent dark:via-dark-border/60 mb-8" />
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-dark-text">TeamTrack</div>
                <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-2 max-w-sm">
                  Open-source collaboration for teams that live in Markdown.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-dark-text-muted">
                <a
                  href="https://t.me/critiq1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 decoration-gray-300 dark:decoration-dark-border hover:decoration-gray-500 transition-colors"
                >
                  Support
                </a>
                <a
                  href="https://github.com/Team-Tracks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 decoration-gray-300 dark:decoration-dark-border hover:decoration-gray-500 transition-colors"
                >
                  GitHub repository
                </a>
                <a
                  href="https://github.com/Team-Tracks/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 decoration-gray-300 dark:decoration-dark-border hover:decoration-gray-500 transition-colors"
                >
                  Contributing.md
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
