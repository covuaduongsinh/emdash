import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/integration.ts", "src/admin.tsx"],
	format: ["esm"],
	dts: false,
	clean: true,
	platform: "node",
	external: ["astro", "emdash", "react", "react-dom"],
});
