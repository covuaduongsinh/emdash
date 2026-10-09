import { PluginRouteError, SchemaRegistry } from "emdash";
import type { RouteContext } from "emdash";
import { getDb } from "emdash/runtime";

import { runChessLessonsSetup, type ChessLessonsSetupResult } from "../schema/setup.js";

/**
 * Route: setup/run
 * Yêu cầu quyền: `schema:manage`
 */
export async function setupRunHandler(_ctx: RouteContext): Promise<ChessLessonsSetupResult> {
	try {
		const db = await getDb();
		const registry = new SchemaRegistry(db);
		return await runChessLessonsSetup(registry);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Cài đặt CSDL bài học thất bại";
		throw new PluginRouteError("SETUP_ERROR", message, 500);
	}
}
