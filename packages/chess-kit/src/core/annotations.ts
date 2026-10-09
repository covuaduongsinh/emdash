export interface ArrowAnnotation {
	from: string;
	to: string;
	color?: string;
}

export interface SquareAnnotation {
	color?: string;
}

const SPLIT_WHITESPACE_REGEX = /\s+/;
const ARROW_COORDS_REGEX = /^[a-h][1-8][a-h][1-8]$/;
const SQUARE_COORDS_REGEX = /^[a-h][1-8]$/;

/**
 * Parse chuỗi biểu diễn mũi tên (vd: "e2e4 g1f3:red d7d5:green")
 */
export function parseArrows(str?: string): ArrowAnnotation[] {
	if (!str || typeof str !== "string") return [];
	const tokens = str.trim().split(SPLIT_WHITESPACE_REGEX).filter(Boolean);
	const arrows: ArrowAnnotation[] = [];

	for (const token of tokens) {
		const parts = token.split(":");
		const coords = parts[0];
		const color = parts[1];

		if (coords && ARROW_COORDS_REGEX.test(coords)) {
			arrows.push({
				from: coords.slice(0, 2),
				to: coords.slice(2, 4),
				color: color || undefined,
			});
		}
	}

	return arrows;
}

/**
 * Parse chuỗi biểu diễn tô màu ô cờ (vd: "e4 d5:yellow f7:red")
 */
export function parseSquares(str?: string): Record<string, SquareAnnotation> {
	if (!str || typeof str !== "string") return {};
	const tokens = str.trim().split(SPLIT_WHITESPACE_REGEX).filter(Boolean);
	const squares: Record<string, SquareAnnotation> = {};

	for (const token of tokens) {
		const parts = token.split(":");
		const square = parts[0];
		const color = parts[1];

		if (square && SQUARE_COORDS_REGEX.test(square)) {
			squares[square] = {
				color: color || undefined,
			};
		}
	}

	return squares;
}
