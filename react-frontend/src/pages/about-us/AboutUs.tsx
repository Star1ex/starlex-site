import React from "react";
import { motion } from "framer-motion";

export default function AboutUs() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#f0c6b7] text-[#5a3f36] px-6 text-center">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-5xl font-serif mb-6"
      >
        About Us
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-lg max-w-2xl leading-relaxed mb-12"
      >
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-col gap-4 w-full max-w-xs"
      >
        <a
          href="https://github.com/Team-Tracks"
          className="py-3 rounded-2xl bg-[#d4a99b] text-[#5a3f36] shadow-sm hover:opacity-80 transition duration-200 text-center"
          style={{ border: "none" }}
        >
          GitHub
        </a>
        <a
          href="https://t.me/teamtrack1"
          className="py-3 rounded-2xl bg-[#d4a99b] text-[#5a3f36] shadow-sm hover:opacity-80 transition duration-200 text-center"
          style={{ border: "none" }}
        >
          Telegram Channel
        </a>
        <a
          href="teamtracktech@gmail.com"
          className="py-3 rounded-2xl bg-[#d4a99b] text-[#5a3f36] shadow-sm hover:opacity-80 transition duration-200 text-center"
          style={{ border: "none" }}
        >
          Support
        </a>
      </motion.div>
    </div>
  );
}