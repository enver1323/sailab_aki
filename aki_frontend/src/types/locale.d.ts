import "i18next";

declare module "i18next" {
  export interface ResourceLanguage {
    translation: {
      header: {
        links: {
          patients: string;
          predictions: string;
        };
      };
    };
  }
}
