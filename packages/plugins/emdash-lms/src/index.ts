/**
 * EmDash LMS — Subscriptions & Memberships
 *
 * A unified Learning Management System plugin for EmDash CMS.
 * Supports three modes:
 * - Membership only: Subscription plans with content access limits
 * - LMS only: Courses with individual purchase
 * - Full: Combined membership + LMS with tiered access
 */

import type { PluginDescriptor, ResolvedPlugin } from "emdash";
import { definePlugin } from "emdash";

import {
	accessRoute,
	accessRouteInputSchema,
	adminStudentsRoute,
	adminStudentsInputSchema,
	meAccessRoute,
	meAccessInputSchema,
	meEnrollRoute,
	meEnrollInputSchema,
	meProgressRoute,
	meProgressInputSchema,
	membersRoute,
	membersRouteInputSchema,
	ordersRoute,
	ordersRouteInputSchema,
	plansRoute,
	plansRouteInputSchema,
	progressCompleteRoute,
	progressCompleteInputSchema,
	progressSyncRoute,
	progressSyncInputSchema,
	setupRunRoute,
	setupRunInputSchema,
} from "./routes/index.js";

// Re-export types & schemas
export * from "./types.js";
export * from "./access-control.js";
export * from "./providers/index.js";
export * from "./schema/setup.js";

// Re-export Astro integration for convenience
export { lmsIntegration, type LmsIntegrationOptions } from "./integration.js";

export interface LmsPluginOptions {
	/** Plugin mode. Default: "full" */
	mode?: "membership" | "lms" | "full";

	/** Membership configuration */
	membership?: {
		/** Enable membership features. Default: true in full/membership mode */
		enabled?: boolean;
	};

	/** Courses configuration */
	courses?: {
		/** Enable course features. Default: true in full/lms mode */
		enabled?: boolean;
		/** Allow individual course purchases. Default: true */
		individualPurchase?: boolean;
	};

	/** Checkout configuration */
	checkout?: {
		/** Enable built-in simple checkout. Default: true */
		enabled?: boolean;
		/** Payment providers */
		providers?: ("stripe" | "sepay" | "bank_transfer")[];
	};

	/** Currency configuration */
	currency?: {
		/** Base currency code. Default: "VND" */
		base?: string;
		/** Display currency code. Default: same as base */
		display?: string;
		/** Exchange rate (display/base). Default: 1 */
		exchangeRate?: number;
	};
}

/**
 * Plugin factory - returns a descriptor for the integration
 */
export function lmsPlugin(options: LmsPluginOptions = {}): PluginDescriptor<LmsPluginOptions> {
	const adminPages = [
		{ path: "/settings/setup", label: "Cài đặt LMS", icon: "wrench", group: "lms" },
		{ path: "/students", label: "Học viên", icon: "student", group: "lms" },
		{ path: "/settings", label: "Cài đặt", icon: "gear", group: "lms" },
	];

	return {
		id: "lms",
		version: "0.2.0",
		entrypoint: "emdash-lms",
		adminEntry: "emdash-lms/admin",
		options,
		adminPages,
	};
}

/**
 * Create the resolved plugin - called by the generated virtual module
 */
export function createPlugin(_options: LmsPluginOptions = {}): ResolvedPlugin {
	const adminPages = [
		{ path: "/settings/setup", label: "Cài đặt LMS", icon: "wrench", group: "lms" },
		{ path: "/students", label: "Học viên", icon: "student", group: "lms" },
		{ path: "/settings", label: "Cài đặt", icon: "gear", group: "lms" },
	];

	return definePlugin({
		id: "lms",
		version: "0.2.0",

		capabilities: ["content:read", "content:write", "users:read"],

		storage: {},

		admin: {
			entry: "emdash-lms/admin",
			pages: adminPages,
		},

		routes: {
			plans: {
				input: plansRouteInputSchema,
				handler: plansRoute,
			},
			members: {
				input: membersRouteInputSchema,
				handler: membersRoute,
			},
			orders: {
				input: ordersRouteInputSchema,
				handler: ordersRoute,
			},
			access: {
				input: accessRouteInputSchema,
				handler: accessRoute,
			},
			"setup/run": {
				input: setupRunInputSchema,
				permission: "schema:manage",
				handler: setupRunRoute,
			},
			"me/access": {
				input: meAccessInputSchema,
				permission: "content:read",
				handler: meAccessRoute,
			},
			"me/enroll": {
				input: meEnrollInputSchema,
				permission: "content:read",
				handler: meEnrollRoute,
			},
			"me/progress": {
				input: meProgressInputSchema,
				permission: "content:read",
				handler: meProgressRoute,
			},
			"progress/complete": {
				input: progressCompleteInputSchema,
				permission: "content:read",
				handler: progressCompleteRoute,
			},
			"progress/sync": {
				input: progressSyncInputSchema,
				permission: "content:read",
				handler: progressSyncRoute,
			},
			"admin/students": {
				input: adminStudentsInputSchema,
				permission: "content:read",
				handler: adminStudentsRoute,
			},
		},
	});
}

export default lmsPlugin;
