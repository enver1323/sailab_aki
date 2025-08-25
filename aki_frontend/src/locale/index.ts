import i18n, { Resource } from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import koreanTranslations from "@/locale/ko";

const resources: Resource = {
  ko: {
    translation: koreanTranslations,
  },
};

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    resources,
    interpolation: { escapeValue: false },
    fallbackLng: "ko",
    debug: import.meta.env.DEV,
    react: {
      useSuspense: false,
    },
  });

export default i18n;
