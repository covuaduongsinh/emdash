import { describe, it, expect } from "vitest";

import * as adminExports from "../src/admin.js";

describe("chessfenpgn admin module exports", () => {
	it("exports named 'pages' and 'fields' objects matching EmDash plugin contract", () => {
		expect(adminExports.pages).toBeDefined();
		expect(typeof adminExports.pages["/editor"]).toBe("function");

		expect(adminExports.fields).toBeDefined();
		expect(typeof adminExports.fields["chess-board"]).toBe("function");
	});
});
