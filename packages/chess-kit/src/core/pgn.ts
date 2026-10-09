import { Chess } from "chess.js";

export interface PgnMoveNode {
	san: string;
	uci: string;
	fen: string;
	comment?: string;
	nag?: string;
	variations?: PgnTree[];
}

export interface PgnTree {
	moves: PgnMoveNode[];
}

export interface ParsedPgn {
	headers: Record<string, string>;
	startFen?: string;
	tree: PgnTree;
}

const HEADER_REGEX = /^\s*\[([A-Za-z0-9_]+)\s+"([^"]*)"\]\s*$/gm;
const STRIP_HEADERS_REGEX = /^\s*\[[^\]]+\]\s*$/gm;
const WHITESPACE_CHAR_REGEX = /\s/;
const NAG_REGEX = /^\$\d+/;
const NON_TOKEN_CHAR_REGEX = /[\s{($]/;
const MOVE_NUMBER_PREFIX_REGEX = /^\d+\.+/;
const SAN_TOKEN_REGEX = /^[a-hNBRQKxO\-+=#1-8]+$/;

/**
 * Phân tích chuỗi PGN thành headers, startFen và cây nước đi
 */
export function parsePgn(pgn: string): ParsedPgn {
	const headers: Record<string, string> = {};

	let match: RegExpExecArray | null;
	while ((match = HEADER_REGEX.exec(pgn)) !== null) {
		const key = match[1];
		const value = match[2];
		if (key && value !== undefined) {
			headers[key] = value;
		}
	}

	const startFen = headers.FEN || (headers.SetUp === "1" ? headers.FEN : undefined);

	// Tách phần moves text (bỏ headers)
	const movesText = pgn.replace(STRIP_HEADERS_REGEX, "").trim();

	// Tải ván cờ với chess.js
	const game = new Chess(startFen);
	try {
		game.loadPgn(pgn);
	} catch {
		// Ignore parse errors on complex annotations
	}

	const history = game.history({ verbose: true });
	const moveNodes: PgnMoveNode[] = [];

	for (const histMove of history) {
		moveNodes.push({
			san: histMove.san,
			uci: `${histMove.from}${histMove.to}${histMove.promotion || ""}`,
			fen: histMove.after,
		});
	}

	// Tokenize moves, comments, NAGs and variations in sequential order
	let currentMoveIndex = -1;
	let pos = 0;

	while (pos < movesText.length) {
		// Bỏ qua khoảng trắng
		while (pos < movesText.length && WHITESPACE_CHAR_REGEX.test(movesText[pos]!)) {
			pos++;
		}
		if (pos >= movesText.length) break;

		// Comment { ... }
		if (movesText[pos] === "{") {
			const closeIdx = movesText.indexOf("}", pos);
			const commentText =
				closeIdx !== -1
					? movesText.slice(pos + 1, closeIdx).trim()
					: movesText.slice(pos + 1).trim();
			if (currentMoveIndex >= 0 && moveNodes[currentMoveIndex]) {
				moveNodes[currentMoveIndex]!.comment = commentText;
			}
			pos = closeIdx !== -1 ? closeIdx + 1 : movesText.length;
			continue;
		}

		// Variation ( ... )
		if (movesText[pos] === "(") {
			let depth = 1;
			let endPos = pos + 1;
			while (endPos < movesText.length && depth > 0) {
				if (movesText[endPos] === "(") depth++;
				else if (movesText[endPos] === ")") depth--;
				endPos++;
			}
			const varContent = movesText.slice(pos + 1, endPos - 1).trim();
			if (varContent && currentMoveIndex >= 0 && moveNodes[currentMoveIndex]) {
				const branchStartFen =
					currentMoveIndex > 0 ? moveNodes[currentMoveIndex - 1]?.fen : startFen;

				try {
					const varGame = new Chess();
					const wrappedVarPgn = branchStartFen
						? `[SetUp "1"]\n[FEN "${branchStartFen}"]\n\n${varContent}`
						: varContent;
					varGame.loadPgn(wrappedVarPgn);
					const varHistory = varGame.history({ verbose: true });
					const varNodes = varHistory.map((h) => ({
						san: h.san,
						uci: `${h.from}${h.to}${h.promotion || ""}`,
						fen: h.after,
					}));
					if (varNodes.length > 0) {
						moveNodes[currentMoveIndex]!.variations = moveNodes[currentMoveIndex]!.variations || [];
						moveNodes[currentMoveIndex]!.variations!.push({ moves: varNodes });
					}
				} catch {
					// Ignore invalid variation
				}
			}
			pos = endPos;
			continue;
		}

		// NAG $1, $2...
		if (movesText[pos] === "$") {
			const nagMatch = NAG_REGEX.exec(movesText.slice(pos));
			if (nagMatch) {
				if (currentMoveIndex >= 0 && moveNodes[currentMoveIndex]) {
					moveNodes[currentMoveIndex]!.nag = nagMatch[0];
				}
				pos += nagMatch[0].length;
				continue;
			}
		}

		// Read regular word/token (move number, SAN, or result)
		let nextSpace = pos;
		while (nextSpace < movesText.length && !NON_TOKEN_CHAR_REGEX.test(movesText[nextSpace]!)) {
			nextSpace++;
		}
		const token = movesText.slice(pos, nextSpace);
		pos = nextSpace;

		const cleanSan = token.replace(MOVE_NUMBER_PREFIX_REGEX, "");
		if (cleanSan && SAN_TOKEN_REGEX.test(cleanSan)) {
			const foundIdx = moveNodes.findIndex(
				(n, idx) => idx > currentMoveIndex && n.san === cleanSan,
			);
			if (foundIdx >= 0) {
				currentMoveIndex = foundIdx;
			}
		}
	}

	return {
		headers,
		startFen,
		tree: { moves: moveNodes },
	};
}

/**
 * Trả về danh sách chuỗi FEN cho từng nước đi của PGN, bắt đầu từ thế cờ xuất phát
 */
export function replayPositions(pgn: string): string[] {
	const parsed = parsePgn(pgn);
	const startFen = parsed.startFen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

	const game = new Chess(startFen);
	try {
		game.loadPgn(pgn);
	} catch {
		// fallback
	}

	const history = game.history({ verbose: true });
	const replayGame = new Chess(startFen);
	const positions: string[] = [replayGame.fen()];

	for (const move of history) {
		replayGame.move(move);
		positions.push(replayGame.fen());
	}

	return positions;
}
