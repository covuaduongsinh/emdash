/**
 * Admin Payment Settings Route
 * Handlers for retrieving and saving SePay and payment gateway configuration
 */

import { PluginRouteError, type RouteContext } from "emdash";
import { z } from "zod";

export const adminPaymentSettingsInputSchema = z.object({
	action: z.enum(["get", "save"]),
	data: z
		.object({
			bank_code: z.string().optional(),
			bank_account: z.string().optional(),
			account_name: z.string().optional(),
			sepay_api_key: z.string().optional(),
			qr_template: z.string().optional(),
			expires_in_hours: z.number().optional(),
		})
		.optional(),
});

export type AdminPaymentSettingsInput = z.infer<typeof adminPaymentSettingsInputSchema>;

export async function adminPaymentSettingsRoute(ctx: RouteContext) {
	if (!ctx.kv) {
		throw PluginRouteError.internal("KV storage not available");
	}

	const input = (ctx.input || {}) as AdminPaymentSettingsInput;

	if (input.action === "get") {
		const bank_code =
			((await ctx.kv.get("settings:bank_code")) as string | null) ||
			process.env.SEPAY_BANK_CODE ||
			"MB";

		const bank_account =
			((await ctx.kv.get("settings:bank_account")) as string | null) ||
			process.env.SEPAY_BANK_ACCOUNT ||
			"";

		const account_name =
			((await ctx.kv.get("settings:account_name")) as string | null) ||
			process.env.SEPAY_ACCOUNT_NAME ||
			"";

		const rawKey =
			((await ctx.kv.get("settings:sepay_api_key")) as string | null) ||
			process.env.SEPAY_API_KEY ||
			"";

		// Mask API Key for security in UI
		const sepay_api_key_masked = rawKey
			? rawKey.length > 8
				? `${rawKey.slice(0, 4)}...${rawKey.slice(-4)}`
				: "********"
			: "";

		const qr_template =
			((await ctx.kv.get("settings:qr_template")) as string | null) || "compact";

		const expires_in_hours = Number(
			((await ctx.kv.get("settings:expires_in_hours")) as number | string | null) || 24,
		);

		return {
			bank_code,
			bank_account,
			account_name,
			has_sepay_api_key: Boolean(rawKey),
			sepay_api_key_masked,
			qr_template,
			expires_in_hours,
		};
	}

	if (input.action === "save") {
		if (!input.data) {
			throw PluginRouteError.badRequest("Data required for save");
		}

		const { bank_code, bank_account, account_name, sepay_api_key, qr_template, expires_in_hours } =
			input.data;

		if (bank_code !== undefined) {
			await ctx.kv.set("settings:bank_code", bank_code.trim());
		}
		if (bank_account !== undefined) {
			await ctx.kv.set("settings:bank_account", bank_account.trim());
		}
		if (account_name !== undefined) {
			await ctx.kv.set("settings:account_name", account_name.trim());
		}
		if (sepay_api_key !== undefined && sepay_api_key.trim().length > 0) {
			await ctx.kv.set("settings:sepay_api_key", sepay_api_key.trim());
		}
		if (qr_template !== undefined) {
			await ctx.kv.set("settings:qr_template", qr_template.trim());
		}
		if (expires_in_hours !== undefined) {
			await ctx.kv.set("settings:expires_in_hours", Number(expires_in_hours));
		}

		return { success: true };
	}

	throw PluginRouteError.badRequest(`Unknown action: ${input.action}`);
}
