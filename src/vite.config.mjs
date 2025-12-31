import glsl from "vite-plugin-glsl";

export default {
  root: "src",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  envDir: "../",
  plugins: [glsl()],
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
        silenceDeprecations: ["legacy-js-api"],
      },
    },
  },
};
