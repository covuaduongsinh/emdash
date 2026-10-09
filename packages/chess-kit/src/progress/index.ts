import { z } from "zod";

export const ProgressDataSchema = z.object({
	puzzles: z.array(z.string()).default([]),
	lectures: z.array(z.string()).default([]),
	lessons: z.array(z.string()).default([]),
	updatedAt: z.string().optional(),
});

export type ProgressData = z.infer<typeof ProgressDataSchema>;

const STORAGE_KEY = "duongsinh-chess:progress:v1";
const PENDING_SYNC_KEY = "duongsinh-chess:pending-sync:v1";
const MAX_STORED_ITEMS = 5000;

function safeGetStorage(): Storage | null {
	if (typeof globalThis.localStorage !== "undefined") {
		return globalThis.localStorage;
	}
	return null;
}

/**
 * Đọc dữ liệu tiến độ từ localStorage
 */
export function getProgress(): ProgressData {
	const storage = safeGetStorage();
	if (!storage) {
		return { puzzles: [], lectures: [], lessons: [] };
	}

	try {
		const raw = storage.getItem(STORAGE_KEY);
		if (!raw) {
			return { puzzles: [], lectures: [], lessons: [] };
		}
		const parsed = JSON.parse(raw);
		const result = ProgressDataSchema.safeParse(parsed);
		if (result.success) {
			return result.data;
		}
		return { puzzles: [], lectures: [], lessons: [] };
	} catch {
		return { puzzles: [], lectures: [], lessons: [] };
	}
}

/**
 * Lưu tiến độ vào localStorage một cách an toàn
 */
function saveProgress(data: ProgressData): boolean {
	const storage = safeGetStorage();
	if (!storage) return false;

	try {
		const clamped: ProgressData = {
			puzzles: data.puzzles.slice(-MAX_STORED_ITEMS),
			lectures: data.lectures.slice(-MAX_STORED_ITEMS),
			lessons: data.lessons.slice(-MAX_STORED_ITEMS),
			updatedAt: new Date().toISOString(),
		};
		storage.setItem(STORAGE_KEY, JSON.stringify(clamped));
		return true;
	} catch (e) {
		console.warn("Không thể lưu tiến độ cờ vua vào localStorage:", e);
		return false;
	}
}

function addToPendingSync(type: "puzzles" | "lectures" | "lessons", id: string): void {
	const storage = safeGetStorage();
	if (!storage) return;

	try {
		const raw = storage.getItem(PENDING_SYNC_KEY);
		let pending: ProgressData = { puzzles: [], lectures: [], lessons: [] };
		if (raw) {
			const parsed = JSON.parse(raw);
			const res = ProgressDataSchema.safeParse(parsed);
			if (res.success) pending = res.data;
		}

		if (!pending[type].includes(id)) {
			pending[type].push(id);
			storage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending));
		}
	} catch {
		// Ignore
	}
}

/**
 * Đánh dấu một câu đố đã được giải thành công
 */
export function markPuzzleSolved(puzzleId: string): void {
	if (!puzzleId) return;
	const current = getProgress();
	if (!current.puzzles.includes(puzzleId)) {
		current.puzzles.push(puzzleId);
		saveProgress(current);
		addToPendingSync("puzzles", puzzleId);
	}
}

/**
 * Đánh dấu một bài giảng đã hoàn thành
 */
export function markLectureCompleted(lectureId: string): void {
	if (!lectureId) return;
	const current = getProgress();
	if (!current.lectures.includes(lectureId)) {
		current.lectures.push(lectureId);
		saveProgress(current);
		addToPendingSync("lectures", lectureId);
	}
}

/**
 * Đánh dấu một bài học LMS đã hoàn thành
 */
export function markLessonCompleted(lessonId: string): void {
	if (!lessonId) return;
	const current = getProgress();
	if (!current.lessons.includes(lessonId)) {
		current.lessons.push(lessonId);
		saveProgress(current);
		addToPendingSync("lessons", lessonId);
	}
}

/**
 * Lấy ra danh sách các mục mới cần đồng bộ lên tài khoản server và xóa sạch hàng đợi pending
 */
export function drainForSync(): ProgressData {
	const storage = safeGetStorage();
	if (!storage) {
		return { puzzles: [], lectures: [], lessons: [] };
	}

	try {
		const raw = storage.getItem(PENDING_SYNC_KEY);
		if (!raw) {
			return { puzzles: [], lectures: [], lessons: [] };
		}
		const parsed = JSON.parse(raw);
		const result = ProgressDataSchema.safeParse(parsed);
		storage.removeItem(PENDING_SYNC_KEY);

		if (result.success) {
			return result.data;
		}
		return { puzzles: [], lectures: [], lessons: [] };
	} catch {
		return { puzzles: [], lectures: [], lessons: [] };
	}
}

/**
 * Xuất dữ liệu tiến độ ra chuỗi JSON để sao lưu hoặc chuyển thiết bị
 */
export function exportProgress(): string {
	const progress = getProgress();
	return JSON.stringify(progress, null, 2);
}

/**
 * Nạp dữ liệu tiến độ từ chuỗi JSON
 */
export function importProgress(jsonStr: string): boolean {
	try {
		const parsed = JSON.parse(jsonStr);
		const result = ProgressDataSchema.safeParse(parsed);
		if (!result.success) return false;

		const current = getProgress();
		const merged: ProgressData = {
			puzzles: [...new Set([...current.puzzles, ...result.data.puzzles])],
			lectures: [...new Set([...current.lectures, ...result.data.lectures])],
			lessons: [...new Set([...current.lessons, ...result.data.lessons])],
			updatedAt: new Date().toISOString(),
		};

		return saveProgress(merged);
	} catch {
		return false;
	}
}

/**
 * Xóa trắng toàn bộ tiến độ cục bộ
 */
export function resetProgress(): void {
	const storage = safeGetStorage();
	if (!storage) return;
	try {
		storage.removeItem(STORAGE_KEY);
		storage.removeItem(PENDING_SYNC_KEY);
	} catch {
		// Ignore
	}
}
