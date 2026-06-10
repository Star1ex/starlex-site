import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.js";
import "./index.css";

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

type SentryEvent = {
  request?: {
    url?: string;
    headers?: Record<string, string>;
  };
};

function stripUrlQuery(value: string): string {
  try {
    const url = new URL(value);
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return value.split('?')[0].split('#')[0];
  }
}

function scrubSentryEvent<TEvent extends SentryEvent>(event: TEvent): TEvent {
  if (event.request?.url) {
    event.request.url = stripUrlQuery(event.request.url);
  }

  if (event.request?.headers) {
    for (const key of Object.keys(event.request.headers)) {
      const normalizedKey = key.toLowerCase();
      if (
        normalizedKey === 'authorization' ||
        normalizedKey === 'cookie' ||
        normalizedKey === 'set-cookie' ||
        normalizedKey.includes('token')
      ) {
        delete event.request.headers[key];
      }
    }
  }

  return event;
}

if (sentryDsn) {
  void import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn: sentryDsn,
      environment: import.meta.env.MODE,
      integrations: [Sentry.browserTracingIntegration()],
      tracesSampleRate: 0.1,
      beforeSend: scrubSentryEvent,
    });
  });
}

// initialize
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
