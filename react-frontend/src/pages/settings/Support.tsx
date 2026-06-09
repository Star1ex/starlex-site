import React from 'react';
import { Mail, MessageCircle } from 'lucide-react';

export const Support: React.FC = () => {
  return (
    <div className="settings-page">
      <section className="settings-section">
        <div className="settings-section-header">
          <h3 className="settings-section-title">Support</h3>
          <p className="settings-section-description">
            Get help fast. Reach us directly for questions, bugs, or feedback.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <a
            href="mailto:support@starlex.cc"
            className="settings-row !justify-start"
          >
            <span className="settings-row-icon">
              <Mail className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="settings-row-title">Email Support</div>
              <div className="settings-row-description">support@starlex.cc</div>
            </div>
          </a>

          <a
            href="https://t.me/critiq1"
            target="_blank"
            rel="noopener noreferrer"
            className="settings-row !justify-start"
          >
            <span className="settings-row-icon">
              <MessageCircle className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="settings-row-title">Telegram</div>
              <div className="settings-row-description">@critiq1 (bug reports)</div>
            </div>
          </a>
        </div>
      </section>
    </div>
  );
};
