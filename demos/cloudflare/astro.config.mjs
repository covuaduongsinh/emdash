// @ts-check
import cloudflare from "@astrojs/cloudflare";
import { cacheCloudflare } from "@astrojs/cloudflare/cache";
import react from "@astrojs/react";
import { d1, r2, cloudflareImages, cloudflareStream } from "@emdash-cms/cloudflare";
import { aiSearch } from "@emdash-cms/cloudflare/plugins";
import { chessfenpgnPlugin } from "@emdash-cms/plugin-chessfenpgn";
import { formsPlugin } from "@emdash-cms/plugin-forms";
import { defineConfig, fontProviders } from "astro/config";
import { lmsPlugin } from "emdash-lms";
import { lmsIntegration } from "emdash-lms/astro";
import emdash from "emdash/astro";

export default defineConfig({
	output: "server",
	adapter: cloudflare({
		imageService: "cloudflare",
	}),
	i18n: {
		defaultLocale: "en",
		locales: ["en", "fr", "es"],
		fallback: {
			fr: "en",
			es: "en",
		},
	},
	image: {
		// Enable responsive images globally
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			// D1 database - binding name must match wrangler.jsonc
			// session: "auto" enables read replicas (nearest replica for anon,
			// bookmark-based consistency for authenticated users)
			database: d1({ binding: "DB", session: "auto" }),
			// R2 storage for media
			storage: r2({ binding: "MEDIA" }),

			// Media providers - Cloudflare Images and Stream
			// Reads from env vars at runtime: CF_ACCOUNT_ID, CF_IMAGES_TOKEN, CF_STREAM_TOKEN
			// Or customize with accountIdEnvVar/apiTokenEnvVar options
			mediaProviders: [
				cloudflareImages({
					accountIdEnvVar: "CF_MEDIA_ACCOUNT_ID",
					apiTokenEnvVar: "CF_MEDIA_API_TOKEN",
					accountHash: "5LGXGUnHU18h6ehN_xjpXQ",
				}),
				cloudflareStream({
					accountIdEnvVar: "CF_MEDIA_ACCOUNT_ID",
					apiTokenEnvVar: "CF_MEDIA_API_TOKEN",
				}),
			],
			// Trusted plugins (run in host worker)
			plugins: [
				// Test plugin that exercises all v2 APIs
				formsPlugin(),
				chessfenpgnPlugin(),
				lmsPlugin({
					mode: "full",
					currency: {
						base: "VND",
						display: "VND",
						exchangeRate: 1,
					},
					courses: {
						enabled: true,
						individualPurchase: true,
					},
					membership: {
						enabled: true,
					},
					checkout: {
						enabled: true,
						providers: ["sepay", "stripe"],
					},
				}),
				aiSearch({
					// AI Search instance name (created on first index). Default: "emdash-content".
					instanceName: "emdash-content",
					// wrangler.jsonc `ai_search_namespaces` binding name. Default: "AI_SEARCH".
					binding: "AI_SEARCH",
					// Hybrid search (vector + keyword). Default: true.
					hybridSearch: true,
					// Public result URLs returned to the AI Search snippet.
					urlTemplates: {
						posts: "/posts/{slug}?lang={locale}",
						pages: "/pages/{slug}?lang={locale}",
					},
				}),
			],
		}),
		lmsIntegration({
			layout: "./src/layouts/Layout.astro",
			basePath: "",
			styles: "plugin",
		}),
	],
	// Preferred edge HTML cache: native Workers Caching via the Astro Cloudflare
	// adapter. Pair with `"cache": { "enabled": true }` in wrangler.jsonc (the
	// adapter also injects that when this provider is detected). Invalidation is
	// `cache.purge()` from cloudflare:workers — no CF_ZONE_ID / API token.
	// Do NOT use cloudflareCache() from @emdash-cms/cloudflare here; that is the
	// legacy Cache API + zone REST purge path.
	cache: {
		provider: cacheCloudflare(),
	},
	routeRules: {
		"/": {
			maxAge: 3_600,
			swr: 864_000,
		},
		"/[...slug]": {
			maxAge: 3_600,
			swr: 864_000,
		},
	},
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
