import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { expect, it } from "vitest";

it("fails closed when the active package manager entrypoint is unavailable", () => {
	const environment = { ...process.env };
	for (const key of Object.keys(environment)) {
		if (key.toLowerCase() === "npm_execpath") {
			delete environment[key];
		}
	}

	const result = spawnSync(
		process.execPath,
		[fileURLToPath(new URL("../scripts/check-packed-output.mjs", import.meta.url))],
		{ encoding: "utf8", env: environment },
	);

	expect(result.status).not.toBe(0);
	expect(result.stderr).toContain("npm_execpath is unavailable");
});
