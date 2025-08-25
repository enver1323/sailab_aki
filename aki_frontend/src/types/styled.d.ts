import "styled-components";

declare module "styled-components" {
  export interface DefaultTheme {
    ui_base: string;
    ui_background: string;

    primary: string;

    border: string;

    font: {
      color: {
        primary: string;
        secondary: string;
        accent: string;
        secondary_accent: string;
        sub: string;
        placeholder: string;
        error: string;
      };
      weight: {
        normal: number;
        semibold: number;
        bold: number;
        light: number;
        extrabold: number;
      };
      size: {
        xs: string;
        s: string;
        sm: string;
        m: string;
        l: string;
        mxl: string;
        xl: string;
      };
    };

    z_index: {
      top_1: number;
      top_2: number;
    };

    hover: {
      hover_on_white_bg: string;
    };
  }
}
