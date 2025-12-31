export default {
	root: "src",
	build: {
		outDir: "../dist",
		emptyOutDir: true,
	},
	envDir: "../",
	css: {
		preprocessorOptions: {
			scss: {
				api: "modern-compiler",
				silenceDeprecations: ["legacy-js-api"],
			},
		},
	},
};
