import node from "@astrojs/node";
import react from "@astrojs/react";
import { defineConfig, fontProviders } from "astro/config";
import emdash, { local } from "emdash/astro";
import { sqlite } from "emdash/db";

export default defineConfig({
	output: "server",
	adapter: node({
		mode: "standalone",
	}),
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			database: sqlite({ url: "file:./data.db" }),
			storage: local({
				directory: "./uploads",
				baseUrl: "/_emdash/api/media/file",
			}),
		}),
	],
	fonts: [
		{
			provider: fontProviders.google(),
			name: "Roboto",
			cssVariable: "--font-sans",
			weights: [300, 400, 500, 700, 900],
			fallbacks: ["sans-serif"],
		},
		{
			provider: fontProviders.google(),
			name: "Roboto Condensed",
			cssVariable: "--font-cond",
			weights: [700, 900],
			fallbacks: ["sans-serif"],
		},
	],
	devToolbar: { enabled: false },
});
