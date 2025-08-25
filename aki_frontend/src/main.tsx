import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "styled-components";
import GlobalStyle, { mainTheme } from "@/themes";
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";
import { RecoilRoot } from "recoil";
import ReactGA from "react-ga4";
import "@/locale";

// ReactGA.initialize(import.meta.env.VITE_GOOGLE_GA4);

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [new BrowserTracing()],
  tracesSampleRate: 1.0,
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={mainTheme}>
      <GlobalStyle />
      <RecoilRoot>
        <App />
      </RecoilRoot>
    </ThemeProvider>
  </React.StrictMode>
);
