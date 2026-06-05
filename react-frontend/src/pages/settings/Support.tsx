import React from 'react';
import { Mail, MessageCircle } from 'lucide-react';

export const Support: React.FC = () => {
  return (
    <div className="space-y-8 text-center max-w-3xl mx-auto">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2">Support</h3>
        <p className="text-sm text-gray-600 dark:text-dark-text-muted">
          Get help fast — reach us directly for questions, bugs, or feedback.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
        <a
          href="mailto:support@starlex.cc"
          className="group flex items-center gap-4 rounded-xl p-4 w-full hover:bg-gray-50 dark:hover:bg-dark-border/40 transition-colors text-left"
        >
          <span className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-dark-border flex items-center justify-center text-gray-700 dark:text-dark-text">
            <Mail className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-dark-text">Email Support</div>
            <div className="text-xs text-gray-600 dark:text-dark-text-muted">support@starlex.cc</div>
          </div>
        </a>

        <a
          href="https://t.me/critiq1"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 rounded-xl p-4 w-full hover:bg-gray-50 dark:hover:bg-dark-border/40 transition-colors text-left"
        >
          <span className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-dark-border flex items-center justify-center text-gray-700 dark:text-dark-text">
            <MessageCircle className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-dark-text">Telegram</div>
            <div className="text-xs text-gray-600 dark:text-dark-text-muted">@critiq1 (bug reports)</div>
          </div>
        </a>
      </div>
    </div>
  );
};
