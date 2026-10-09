import { describe, expect, it } from "vitest";

import * as adminModule from "../src/admin.js";
import { createPlugin } from "../src/index.js";
import { plansRoute } from "../src/routes/plans.js";

describe("Phase 2a & 2b: Resolved Errors Baseline (L1, L2, L5, L6, L10, L12)", () => {
	// L1: Handler expects 1 single RouteContext object { input, ... }
	it("L1: plansRoute succeeds when called with EmDash single RouteContext argument", async () => {
		const mockRouteContext = {
			input: { action: "list" as const },
			content: {
				list: async () => ({ items: [], nextCursor: undefined }),
			},
		};

		// EmDash core invokes routes with 1 parameter: handler(routeContext).
		// Fixed in Phase 2a: plansRoute now accepts 1 RouteContext argument.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await plansRoute(mockRouteContext as any);
		expect(result).toBeDefined();
		expect(result).toEqual({ items: [] });
	});

	// L2: EmDash imports admin module with `import * as` and looks for named export `pages`.
	it("L2: admin entrypoint has a named `pages` export for EmDash plugin virtual modules", () => {
		expect(adminModule.pages).toBeDefined();
		expect(typeof adminModule.pages).toBe("object");
		expect(adminModule.pages["/settings/setup"]).toBeDefined();
		expect(adminModule.pages["/students"]).toBeDefined();
		expect(adminModule.pages["/orders"]).toBeDefined();
		expect(adminModule.pages["/plans"]).toBeDefined();
		expect(adminModule.pages["/members"]).toBeDefined();
		expect(adminModule.pages["/settings/payment"]).toBeDefined();
		expect(adminModule.pages["/settings"]).toBeDefined();
	});

	// L10: Plugin capabilities use modern naming convention without type assertion hacks
	it("L10: createPlugin defines modern capabilities and registered routes", () => {
		const plugin = createPlugin();
		expect(plugin.id).toBe("lms");
		expect(plugin.capabilities).toEqual(["content:read", "content:write", "users:read"]);
		expect(plugin.routes["setup/run"]).toBeDefined();
		expect(plugin.routes["me/access"]).toBeDefined();
		expect(plugin.routes["me/enroll"]).toBeDefined();
		expect(plugin.routes["progress/complete"]).toBeDefined();
		expect(plugin.routes["progress/sync"]).toBeDefined();
		expect(plugin.routes["me/progress"]).toBeDefined();
		expect(plugin.routes["admin/students"]).toBeDefined();
	});

	// L5, L6, L12: Checkout & SePay Webhook registered and verified in Phase 2b
	it("L5, L6, L12: checkout and SePay webhook routes are registered securely", () => {
		const plugin = createPlugin();
		const routes = (plugin as unknown as { routes: Record<string, { public?: boolean }> }).routes;
		expect(routes["checkout/create"]).toBeDefined();
		expect(routes["me/orders/get"]).toBeDefined();
		expect(routes["webhook/sepay"]).toBeDefined();
		expect(routes["webhook/sepay"].public).toBe(true);
	});
});
