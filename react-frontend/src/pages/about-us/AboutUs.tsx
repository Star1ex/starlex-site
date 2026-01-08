import React from "react";
import { motion } from "framer-motion";

export default function AboutUs() {
  return (
    <div className="min-h-full flex flex-col justify-center items-center bg-white dark:bg-dark-bg text-black dark:text-dark-text px-6 text-center transition-colors duration-300 py-12">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-5xl font-serif mb-6 transition-colors duration-300"
      >
        About Us
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-lg max-w-2xl leading-relaxed mb-12 transition-colors duration-300"
      >
        Open Source minimalistic task manager. Connect with us via GitHub, Telegram or email for support.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-col gap-4 w-full max-w-xs"
      >
        <a
          href="https://github.com/Team-Tracks"
          className="py-3 rounded-2xl bg-black dark:bg-white text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-200 text-center"
          style={{ border: "none" }}
        >
          GitHub
        </a>
        <a
          href="https://t.me/teamtrack1"
          className="py-3 rounded-2xl bg-black dark:bg-white text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-200 text-center"
          style={{ border: "none" }}
        >
          Telegram Channel
        </a>
        <a
          href="mailto:teamtracktech@gmail.com"
          className="py-3 rounded-2xl bg-black dark:bg-white text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-200 text-center"
          style={{ border: "none" }}
        >
          Support
        </a>
      </motion.div>
    </div>
  );
}
