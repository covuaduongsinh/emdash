import type { ChessLevel } from "@duongsinh/chess-kit/core";

/**
 * Ánh xạ điểm Elo sang 6 cấp độ cờ vua Dương Sinh:
 * - tot: < 1000 (Khởi đầu)
 * - ma: 1000 - 1299 (Nhập môn)
 * - tuong: 1300 - 1599 (Trung cấp)
 * - xe: 1600 - 1899 (Tiên tiến)
 * - hau: 1900 - 2199 (Chuyên sâu)
 * - vua: >= 2200 (Bậc thầy)
 */
export function ratingToLevel(rating: number | undefined | null): ChessLevel["id"] {
	if (rating === undefined || rating === null || Number.isNaN(rating)) {
		return "tot";
	}
	if (rating < 1000) return "tot";
	if (rating < 1300) return "ma";
	if (rating < 1600) return "tuong";
	if (rating < 1900) return "xe";
	if (rating < 2200) return "hau";
	return "vua";
}
