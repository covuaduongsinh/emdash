import { describe, expect, it } from "vitest";

import * as adminModule from "../src/admin.js";
import { createPlugin } from "../src/index.js";
import { plansRoute } from "../src/routes/plans.js";

describe("Phase 0 Baseline: Documenting Existing Errors L1, L2, L12", () => {
	// L1: Handler expects (ctx, input) but EmDash core passes a single RouteContext object { input, ... }
	// In Phase 2a, this will be converted to a regular passing test once L1 handler signature is updated to 1 RouteContext param.
	it.fails("L1: plansRoute fails when called with EmDash single RouteContext argument", async () => {
		const mockRouteContext = {
			input: { action: "list" as const },
			content: {
				list: async () => ({ items: [], nextCursor: undefined }),
			},
		};

		// EmDash core invokes routes with 1 parameter: handler(routeContext).
		// Currently plansRoute expects (ctx, input), so input is undefined and it throws TypeError on `const { action } = input;`.
		// @ts-expect-error simulating EmDash core 1-arg invocation
		const result = await plansRoute(mockRouteContext);
		expect(result).toBeDefined();
	});

	// L2: EmDash imports admin module with `import * as` and looks for named export `pages`.
	// Currently admin.tsx only does `export default { pages: ... }`, so adminModule.pages is undefined.
	// In Phase 2a, this will be converted to a regular passing test once named export `pages` is added.
	it.fails("L2: admin entrypoint has a named `pages` export for EmDash plugin virtual modules", () => {
		// @ts-expect-error adminModule.pages is currently missing
		expect(adminModule.pages).toBeDefined();
		// @ts-expect-error adminModule.pages should contain routes
		expect(typeof adminModule.pages).toBe("object");
	});

	// L12: Checkout route definition in plugin routes.
	// Currently checkout route is not public (defaults to private requiring plugins:manage permission)
	// and does not handle form-urlencoded POST requests.
	// In Phase 2b, this will be converted to a regular passing test once checkout is updated.
	it.fails("L12: checkout route is configured as public in plugin route table", () => {
		const plugin = createPlugin();
		const routes = (plugin as unknown as { routes: Record<string, { public?: boolean }> }).routes;
		expect(routes.checkout).toBeDefined();
		// Fails currently because checkout route does not have public: true
		expect(routes.checkout.public).toBe(true);
	});
});
