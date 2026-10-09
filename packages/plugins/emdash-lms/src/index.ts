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
	adminOrdersConfirmInputSchema,
	adminOrdersConfirmRoute,
	adminOrdersListInputSchema,
	adminOrdersListRoute,
	adminPaymentSettingsInputSchema,
	adminPaymentSettingsRoute,
	adminQuestionDeleteInputSchema,
	adminQuestionDeleteRoute,
	adminQuestionReorderInputSchema,
	adminQuestionReorderRoute,
	adminQuestionSaveInputSchema,
	adminQuestionSaveRoute,
	adminQuizDeleteInputSchema,
	adminQuizDeleteRoute,
	adminQuizGetInputSchema,
	adminQuizGetRoute,
	adminQuizListInputSchema,
	adminQuizListRoute,
	adminQuizOptionsInputSchema,
	adminQuizOptionsRoute,
	adminQuizSaveInputSchema,
	adminQuizSaveRoute,
	adminStudentsInputSchema,
	adminStudentsRoute,
	checkoutCreateInputSchema,
	checkoutCreateRoute,
	meAccessInputSchema,
	meAccessRoute,
	meEnrollInputSchema,
	meEnrollRoute,
	meOrdersGetInputSchema,
	meOrdersGetRoute,
	meProgressInputSchema,
	meProgressRoute,
	meQuizSubmitRoute,
	membersRoute,
	membersRouteInputSchema,
	ordersRoute,
	ordersRouteInputSchema,
	plansRoute,
	plansRouteInputSchema,
	progressCompleteInputSchema,
	progressCompleteRoute,
	progressSyncInputSchema,
	progressSyncRoute,
	quizPresentInputSchema,
	quizPresentRoute,
	quizSubmitInputSchema,
	quizSubmitRoute,
	setupRunInputSchema,
	setupRunRoute,
	webhookSepayInputSchema,
	webhookSepayRoute,
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

const ADMIN_PAGES = [
	{ path: "/settings/setup", label: "Cài đặt LMS", icon: "wrench", group: "lms" },
	{ path: "/quizzes", label: "Quiz & Bài tập", icon: "clipboard-list", group: "lms" },
	{ path: "/students", label: "Học viên", icon: "student", group: "lms" },
	{ path: "/orders", label: "Đơn hàng", icon: "receipt", group: "lms" },
	{ path: "/plans", label: "Thẻ thư viện", icon: "credit-card", group: "lms" },
	{ path: "/members", label: "Hội viên", icon: "user-check", group: "lms" },
	{ path: "/settings/payment", label: "Thanh toán", icon: "banknotes", group: "lms" },
	{ path: "/settings", label: "Cài đặt", icon: "gear", group: "lms" },
];

/**
 * Plugin factory - returns a descriptor for the integration
 */
export function lmsPlugin(options: LmsPluginOptions = {}): PluginDescriptor<LmsPluginOptions> {
	return {
		id: "lms",
		version: "0.2.0",
		entrypoint: "emdash-lms",
		adminEntry: "emdash-lms/admin",
		options,
		adminPages: ADMIN_PAGES,
	};
}

/**
 * Create the resolved plugin - called by the generated virtual module
 */
export function createPlugin(_options: LmsPluginOptions = {}): ResolvedPlugin {
	return definePlugin({
		id: "lms",
		version: "0.2.0",

		capabilities: ["content:read", "content:write", "users:read"],

		storage: {},

		admin: {
			entry: "emdash-lms/admin",
			pages: ADMIN_PAGES,
			portableTextBlocks: [
				{
					type: "lms-quiz",
					label: "LMS Quiz",
					icon: "clipboard-list",
					description: "Chèn bài trắc nghiệm hoặc câu đố cờ vua vào bài học",
					category: "Cờ vua",
					fields: [
						{
							type: "select",
							action_id: "quizId",
							label: "Chọn Quiz",
							options: [],
							optionsRoute: "admin/quiz/options",
						},
					],
				},
			],
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
			"me/orders/get": {
				input: meOrdersGetInputSchema,
				permission: "content:read",
				handler: meOrdersGetRoute,
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
			"checkout/create": {
				input: checkoutCreateInputSchema,
				permission: "content:read",
				handler: checkoutCreateRoute,
			},
			"webhook/sepay": {
				input: webhookSepayInputSchema,
				public: true,
				handler: webhookSepayRoute,
			},
			"admin/students": {
				input: adminStudentsInputSchema,
				permission: "content:read",
				handler: adminStudentsRoute,
			},
			"admin/orders/list": {
				input: adminOrdersListInputSchema,
				permission: "content:read",
				handler: adminOrdersListRoute,
			},
			"admin/orders/confirm": {
				input: adminOrdersConfirmInputSchema,
				permission: "content:edit_any",
				handler: adminOrdersConfirmRoute,
			},
			"admin/settings/payment": {
				input: adminPaymentSettingsInputSchema,
				permission: "schema:manage",
				handler: adminPaymentSettingsRoute,
			},
			"admin/quiz/list": {
				input: adminQuizListInputSchema,
				permission: "content:read",
				handler: adminQuizListRoute,
			},
			"admin/quiz/get": {
				input: adminQuizGetInputSchema,
				permission: "content:read",
				handler: adminQuizGetRoute,
			},
			"admin/quiz/save": {
				input: adminQuizSaveInputSchema,
				permission: "content:edit_any",
				handler: adminQuizSaveRoute,
			},
			"admin/quiz/delete": {
				input: adminQuizDeleteInputSchema,
				permission: "content:edit_any",
				handler: adminQuizDeleteRoute,
			},
			"admin/question/save": {
				input: adminQuestionSaveInputSchema,
				permission: "content:edit_any",
				handler: adminQuestionSaveRoute,
			},
			"admin/question/delete": {
				input: adminQuestionDeleteInputSchema,
				permission: "content:edit_any",
				handler: adminQuestionDeleteRoute,
			},
			"admin/question/reorder": {
				input: adminQuestionReorderInputSchema,
				permission: "content:edit_any",
				handler: adminQuestionReorderRoute,
			},
			"admin/quiz/options": {
				input: adminQuizOptionsInputSchema,
				permission: "content:create",
				handler: adminQuizOptionsRoute,
			},
			"quiz/present": {
				input: quizPresentInputSchema,
				public: true,
				handler: quizPresentRoute,
			},
			"quiz/submit": {
				input: quizSubmitInputSchema,
				public: true,
				handler: quizSubmitRoute,
			},
			"me/quiz/submit": {
				input: quizSubmitInputSchema,
				permission: "content:read",
				handler: meQuizSubmitRoute,
			},
		},
	});
}

export default lmsPlugin;
