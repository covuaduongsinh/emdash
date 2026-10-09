import { Chess } from "chess.js";

export interface CheckPuzzleMoveResult {
	correct: boolean;
	opponentReply?: string;
	done: boolean;
	message?: string;
}

export interface ChessPuzzleSpec {
	fen: string;
	solution: string[]; // danh sách các nước đi dạng UCI
	prompt?: string;
	hint?: string;
	explanation?: string;
}

export interface GradeChessResult {
	correct: boolean;
	score?: number;
	reason?: string;
}

/**
 * Kiểm tra nước đi của người chơi trong bài tập câu đố chiến thuật
 * Chấp nhận MỌI nước đi chiếu hết nếu nước cuối cùng của lời giải là chiếu hết
 */
export function checkPuzzleMove(
	fen: string,
	solutionUci: string[],
	plyIndex: number,
	moveUci: string,
): CheckPuzzleMoveResult {
	if (!solutionUci || solutionUci.length === 0) {
		return { correct: false, done: false, message: "Lời giải câu đố trống" };
	}

	const expectedMove = solutionUci[plyIndex];
	const game = new Chess(fen);

	// Thử thực hiện nước đi của người chơi
	const from = moveUci.slice(0, 2);
	const to = moveUci.slice(2, 4);
	const promotion = moveUci.length > 4 ? moveUci.slice(4, 5).toLowerCase() : undefined;

	let moveResult: unknown;
	try {
		moveResult = game.move({ from, to, promotion });
	} catch {
		return { correct: false, done: false, message: "Nước đi không hợp lệ trên bàn cờ" };
	}

	if (!moveResult) {
		return { correct: false, done: false, message: "Nước đi không hợp lệ" };
	}

	// 1. Nếu trùng khớp chính xác với nước đi mong đợi
	if (moveUci === expectedMove) {
		const nextPly = plyIndex + 1;
		// Nếu đây là nước cuối cùng trong lời giải
		if (nextPly >= solutionUci.length) {
			return { correct: true, done: true, message: "Chính xác! Bạn đã hoàn thành câu đố." };
		}

		// Nước tiếp theo là nước đáp của đối thủ
		const opponentReply = solutionUci[nextPly];
		const nextPlayerPly = nextPly + 1;
		const isDone = nextPlayerPly >= solutionUci.length;

		return {
			correct: true,
			opponentReply,
			done: isDone,
			message: isDone ? "Chính xác! Bạn đã hoàn thành câu đố." : "Nước đi đúng! Hãy tiếp tục.",
		};
	}

	// 2. Kiểm tra xem nước đi của người chơi có phải là chiếu hết thay thế không
	// (Áp dụng khi người chơi tìm ra một nước chiếu hết hợp lệ khác với đáp án lưu trong DB)
	if (game.isCheckmate()) {
		return {
			correct: true,
			done: true,
			message: "Tuyệt vời! Bạn đã tìm ra nước chiếu hết.",
		};
	}

	// Nước đi sai
	return {
		correct: false,
		done: false,
		message: "Nước đi chưa chính xác. Hãy thử lại!",
	};
}

/**
 * Chấm điểm câu trả lời cờ vua phía server
 */
export function gradeChessAnswer(
	puzzle: { fen: string; solution: string[] },
	playedUci: string[],
): GradeChessResult {
	if (!puzzle.solution || puzzle.solution.length === 0) {
		return { correct: false, reason: "Câu đố không có đáp án chuẩn" };
	}

	if (!playedUci || playedUci.length === 0) {
		return { correct: false, reason: "Chưa có nước đi nào được thực hiện" };
	}

	let currentFen = puzzle.fen;
	let ply = 0;

	for (const move of playedUci) {
		const check = checkPuzzleMove(currentFen, puzzle.solution, ply, move);
		if (!check.correct) {
			return { correct: false, reason: check.message || "Nước đi không chính xác" };
		}

		if (check.done) {
			return { correct: true, score: 100, reason: "Hoàn thành chính xác toàn bộ câu đố" };
		}

		// Cập nhật FEN sau nước của người chơi
		const game = new Chess(currentFen);
		game.move({
			from: move.slice(0, 2),
			to: move.slice(2, 4),
			promotion: move.length > 4 ? move.slice(4, 5).toLowerCase() : undefined,
		});

		// Nếu có nước đáp của máy
		if (check.opponentReply) {
			game.move({
				from: check.opponentReply.slice(0, 2),
				to: check.opponentReply.slice(2, 4),
				promotion:
					check.opponentReply.length > 4
						? check.opponentReply.slice(4, 5).toLowerCase()
						: undefined,
			});
			ply += 2;
		} else {
			ply += 1;
		}

		currentFen = game.fen();
	}

	return {
		correct: false,
		reason: "Câu đố chưa hoàn thành đủ các nước đi yêu cầu",
	};
}
