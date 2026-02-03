import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/Button.js";
import { isAuthenticated } from "@/shared/lib/authManager.js";
import heroVideo from "@/assets/home-page-video.mp4";

export const HomePage = () => {
  const navigate = useNavigate();
  const authed = isAuthenticated();

  const handleGetStarted = () => {
    navigate("/sign-in");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg transition-colors duration-300">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.08),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(14,116,144,0.08),transparent_45%),radial-gradient(circle_at_50%_80%,rgba(16,185,129,0.08),transparent_50%)]" />
        <div className="relative max-w-6xl mx-auto px-6 sm:px-10 pt-10 sm:pt-14 pb-16">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-semibold">
                TT
              </div>
              <div className="text-sm text-gray-600 dark:text-dark-text-muted">TeamTrack</div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              {authed ? (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => navigate("/dashboard")}
                  className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-200 w-full sm:w-auto"
                >
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => navigate("/sign-in")}
                    className="bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border transition-colors duration-200 w-full sm:w-auto"
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => navigate("/sign-up")}
                    className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-200 w-full sm:w-auto"
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </header>

          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-200 dark:border-dark-border text-xs text-gray-600 dark:text-dark-text-muted mb-6">
                Open Source • Real-time • Personal + Team
              </div>
              <h1
                className="text-4xl sm:text-5xl md:text-6xl font-semibold text-gray-900 dark:text-dark-text leading-tight"
                style={{ fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif' }}
              >
                Modern task tracking with a calm, focused workspace.
              </h1>
              <p className="mt-5 text-base sm:text-lg text-gray-600 dark:text-dark-text-muted leading-relaxed max-w-xl">
                TeamTrack keeps tasks, folders, and progress in one clean place. Build momentum with a sidebar-first workflow,
                rich Markdown tasks, and fast keyboard-friendly interactions.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={authed ? () => navigate("/dashboard") : handleGetStarted}
                  className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-200 w-full sm:w-auto"
                >
                  {authed ? "Open Dashboard" : "Get Started"}
                </Button>
                <a
                  href="https://github.com/Team-Tracks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-md border border-gray-200 dark:border-dark-border text-sm text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-border transition-colors w-full sm:w-auto text-center"
                >
                  View Repository
                </a>
                <a
                  href="https://t.me/teamtrack1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-md border border-gray-200 dark:border-dark-border text-sm text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-border transition-colors w-full sm:w-auto text-center"
                >
                  Community Channel
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-blue-100/40 via-white/40 to-emerald-100/40 dark:from-blue-900/20 dark:via-dark-bg/20 dark:to-emerald-900/20 rounded-3xl blur-2xl" />
              <div className="relative rounded-3xl border border-gray-200 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 p-4 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs text-gray-500 dark:text-dark-text-muted">Future preview</div>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-dark-border" />
                    <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-dark-border" />
                    <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-dark-border" />
                  </div>
                </div>
                <div className="relative aspect-video rounded-2xl border border-dashed border-gray-300 dark:border-dark-border overflow-hidden bg-black/10 dark:bg-dark-bg">
                  <video
                    className="absolute inset-0 h-full w-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    src={heroVideo}
                  />
                  <div className="absolute inset-0 bg-black/25 dark:bg-black/35" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="px-4 py-2 rounded-full bg-white/80 dark:bg-dark-surface/80 text-xs font-semibold text-gray-900 dark:text-dark-text border border-gray-200 dark:border-dark-border">
                      Coming Soon
                    </span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-gray-600 dark:text-dark-text-muted">
                  <div className="rounded-xl border border-gray-200 dark:border-dark-border p-3">Fast sidebar</div>
                  <div className="rounded-xl border border-gray-200 dark:border-dark-border p-3">Markdown tasks</div>
                  <div className="rounded-xl border border-gray-200 dark:border-dark-border p-3">Team workflows</div>
                </div>
              </div>
            </div>
          </div>

          <section className="mt-16 grid md:grid-cols-3 gap-6">
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
              <div key={card.title} className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white/70 dark:bg-dark-surface/70 p-6 shadow-sm">
                <h3 className="text-base font-semibold text-gray-900 dark:text-dark-text mb-2">{card.title}</h3>
                <p className="text-sm text-gray-600 dark:text-dark-text-muted leading-relaxed">{card.body}</p>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
};
