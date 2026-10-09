import { PluginRouteError, SchemaRegistry } from "emdash";
import type { RouteContext } from "emdash";
import { getDb } from "emdash/runtime";

import { runChessPuzzlesSetup, type ChessPuzzlesSetupResult } from "../schema/setup.js";

/**
 * Route: setup/run
 * Yêu cầu quyền: `schema:manage`
 */
export async function setupRunHandler(_ctx: RouteContext): Promise<ChessPuzzlesSetupResult> {
	try {
		const db = await getDb();
		const registry = new SchemaRegistry(db);
		return await runChessPuzzlesSetup(registry);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Cài đặt CSDL câu đố thất bại";
		throw new PluginRouteError("SETUP_ERROR", message, 500);
	}
}
