import { PluginRouteError, SchemaRegistry } from "emdash";
import type { RouteContext } from "emdash";
import { getDb } from "emdash/runtime";
import { z } from "zod";

import { runLmsSetup, type SetupResult } from "../schema/setup.js";

export const setupRunInputSchema = z.object({}).optional();

export type SetupRunInput = z.infer<typeof setupRunInputSchema>;

/**
 * Route handler: setup/run
 * Requires `schema:manage` permission (admin only).
 * Performs idempotent LMS schema registration and table convergence.
 */
export async function setupRunRoute(_ctx: RouteContext): Promise<SetupResult> {
	try {
		const db = await getDb();
		const registry = new SchemaRegistry(db);
		return await runLmsSetup(registry);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Schema setup failed";
		throw new PluginRouteError("SETUP_ERROR", message, 500);
	}
}
