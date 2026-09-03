import node from "@astrojs/node";
import react from "@astrojs/react";
import auditLog from "@emdash-cms/plugin-audit-log";
import { mcpSmokePlugin } from "@emdash-cms/plugin-mcp-smoke";
import { formsPlugin } from "@emdash-cms/plugin-forms";
import { embedsPlugin } from "@emdash-cms/plugin-embeds";
import { colorPlugin } from "@emdash-cms/plugin-color";
import { fieldKitPlugin } from "@emdash-cms/plugin-field-kit";
import webhookNotifier from "@emdash-cms/plugin-webhook-notifier";
import { myLocalPlugin } from "./src/plugins/my-local-plugin/index.ts";
import { chessfenpgnPlugin } from "@emdash-cms/plugin-chessfenpgn";
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
			marketplace: "https://marketplace.emdashcms.com",
			sandboxRunner: "@emdash-cms/sandbox-workerd",
			plugins: [auditLog, mcpSmokePlugin(), formsPlugin(), embedsPlugin(), colorPlugin(), fieldKitPlugin(), webhookNotifier, myLocalPlugin(), chessfenpgnPlugin()],
		}),
	],
	fonts: [
		{
			provider: fontProviders.google(),
			name: "Inter",
			cssVariable: "--font-sans",
			weights: [400, 500, 600, 700],
			fallbacks: ["sans-serif"],
		},
		{
			provider: fontProviders.google(),
			name: "JetBrains Mono",
			cssVariable: "--font-mono",
			weights: [400, 500],
			fallbacks: ["monospace"],
		},
	],
	devToolbar: { enabled: false },
});
