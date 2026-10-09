import { beforeEach, describe, expect, it } from "vitest";

import {
	drainForSync,
	exportProgress,
	getProgress,
	importProgress,
	markLectureCompleted,
	markLessonCompleted,
	markPuzzleSolved,
	resetProgress,
} from "../../src/progress/index.js";

describe("Client progress storage with localStorage", () => {
	beforeEach(() => {
		// Mock simple localStorage for tests
		const store = new Map<string, string>();
		globalThis.localStorage = {
			getItem: (key: string) => store.get(key) ?? null,
			setItem: (key: string, val: string) => store.set(key, val),
			removeItem: (key: string) => store.delete(key),
			clear: () => store.clear(),
			length: store.size,
			key: (_index: number) => null,
		};
	});

	it("initializes empty progress correctly", () => {
		const progress = getProgress();
		expect(progress.puzzles).toEqual([]);
		expect(progress.lectures).toEqual([]);
		expect(progress.lessons).toEqual([]);
	});

	it("records solved puzzle, lecture and lesson completion", () => {
		markPuzzleSolved("puz_1");
		markPuzzleSolved("puz_2");
		markLectureCompleted("lec_1");
		markLessonCompleted("les_1");

		const progress = getProgress();
		expect(progress.puzzles).toContain("puz_1");
		expect(progress.puzzles).toContain("puz_2");
		expect(progress.lectures).toContain("lec_1");
		expect(progress.lessons).toContain("les_1");
	});

	it("handles corrupted localStorage gracefully without crashing", () => {
		localStorage.setItem("duongsinh-chess:progress:v1", "INVALID_JSON_CORRUPTED{");
		const progress = getProgress();
		expect(progress.puzzles).toEqual([]);
		expect(progress.lectures).toEqual([]);
		expect(progress.lessons).toEqual([]);
	});

	it("exports and imports progress correctly", () => {
		markPuzzleSolved("puz_test");
		const exported = exportProgress();
		expect(exported).toContain("puz_test");

		resetProgress();
		expect(getProgress().puzzles.length).toBe(0);

		const success = importProgress(exported);
		expect(success).toBe(true);
		expect(getProgress().puzzles).toContain("puz_test");
	});

	it("drains progress for sync to server and resets local pending", () => {
		markPuzzleSolved("puz_sync_1");
		markLessonCompleted("les_sync_1");

		const drained = drainForSync();
		expect(drained.puzzles).toContain("puz_sync_1");
		expect(drained.lessons).toContain("les_sync_1");

		// After drain, pending items are clear
		const drainedAgain = drainForSync();
		expect(drainedAgain.puzzles.length).toBe(0);
		expect(drainedAgain.lessons.length).toBe(0);
	});
});
