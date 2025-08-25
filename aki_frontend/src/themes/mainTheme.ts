import { DefaultTheme } from "styled-components";
import { primary_palette } from "@/themes/colors";

const mainTheme: DefaultTheme = {
  font: {
    color: {
      accent: primary_palette.primary,
      primary: primary_palette.black,
      sub: primary_palette.secondary,
      secondary: primary_palette.grey_600,
      secondary_accent: primary_palette.secondary,
      placeholder: primary_palette.grey_600,
      error: primary_palette.red,
    },
    weight: {
      normal: 400,
      semibold: 500,
      bold: 700,
      light: 200,
      extrabold: 900,
    },
    size: {
      xs: "0.625rem",
      s: "0.75rem",
      sm: "0.9rem",
      m: "1rem",
      l: "1.25rem",
      mxl: "1.5rem",
      xl: "2rem",
    },
  },
  ui_base: primary_palette.white,
  ui_background: primary_palette.background,
  primary: primary_palette.primary,
  border: `solid 1px ${primary_palette.grey_400}`,

  z_index: {
    top_1: 9999,
    top_2: 999,
  },

  hover: {
    hover_on_white_bg: primary_palette.grey_900,
  },
};

export default mainTheme;
