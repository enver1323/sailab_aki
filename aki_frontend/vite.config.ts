import { defineConfig } from "vite";
import { config } from 'dotenv';
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";

config();

// https://vitejs.dev/config/
export default ({ mode }) => {
  return defineConfig({
    plugins: [react(), tsconfigPaths()],
    server: {
      port: parseInt(process.env.VITE_FRONTEND_PORT || 3000),
    },
    // base: "/static/dist"
  });
};
