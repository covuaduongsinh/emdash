export type SupportedLanguage = "vi" | "en";

export const DICTIONARY = {
	vi: {
		// General
		white: "Trắng",
		black: "Đen",
		flipBoard: "Lật bàn cờ",
		resetBoard: "Xếp lại từ đầu",
		play: "Chơi",
		pause: "Tạm dừng",
		nextMove: "Nước tiếp theo",
		prevMove: "Nước trước đó",
		firstMove: "Về đầu ván",
		lastMove: "Tới cuối ván",
		notationToggle: "Đổi hiển thị ký hiệu (Quốc tế / Tiếng Việt)",
		copyFen: "Sao chép FEN",
		copyPgn: "Sao chép PGN",
		copied: "Đã sao chép!",

		// Puzzle
		solvePuzzle: "Giải câu đố",
		puzzleSolved: "Chính xác! Bạn đã hoàn thành câu đố.",
		puzzleFailed: "Nước đi chưa chính xác. Hãy thử lại!",
		yourTurn: "Lượt của bạn",
		whiteToMove: "Trắng đi trước",
		blackToMove: "Đen đi trước",
		hint: "Gợi ý",
		showSolution: "Xem đáp án",
		nextPuzzle: "Câu tiếp theo",
		retry: "Thử lại",

		// Position Editor
		clearBoard: "Xóa bàn cờ",
		startingPosition: "Thế xuất phát",
		sideToMove: "Bên đi",
		castlingRights: "Quyền nhập thành",
		whiteKingside: "Trắng nhập thành gần (O-O)",
		whiteQueenside: "Trắng nhập thành xa (O-O-O)",
		blackKingside: "Đen nhập thành gần (O-O)",
		blackQueenside: "Đen nhập thành xa (O-O-O)",
		sparePieces: "Quân dự bị",

		// Move recorder
		recordMoves: "Ghi nước đi",
		startRecording: "Bắt đầu ghi",
		stopRecording: "Dừng ghi",
		clearMoves: "Xóa các nước đã ghi",

		// Lecture Player
		step: "Bước",
		nextStep: "Bước tiếp",
		prevStep: "Bước trước",
		finishLecture: "Hoàn thành bài giảng",
		teacherNotes: "Ghi chú cho Huấn luyện viên",
	},
	en: {
		white: "White",
		black: "Black",
		flipBoard: "Flip board",
		resetBoard: "Reset board",
		play: "Play",
		pause: "Pause",
		nextMove: "Next move",
		prevMove: "Previous move",
		firstMove: "First move",
		lastMove: "Last move",
		notationToggle: "Toggle notation (International / Vietnamese)",
		copyFen: "Copy FEN",
		copyPgn: "Copy PGN",
		copied: "Copied!",

		solvePuzzle: "Solve puzzle",
		puzzleSolved: "Correct! You have solved the puzzle.",
		puzzleFailed: "Incorrect move. Please try again!",
		yourTurn: "Your turn",
		whiteToMove: "White to move",
		blackToMove: "Black to move",
		hint: "Hint",
		showSolution: "Show solution",
		nextPuzzle: "Next puzzle",
		retry: "Retry",

		clearBoard: "Clear board",
		startingPosition: "Starting position",
		sideToMove: "Side to move",
		castlingRights: "Castling rights",
		whiteKingside: "White kingside (O-O)",
		whiteQueenside: "White queenside (O-O-O)",
		blackKingside: "Black kingside (O-O)",
		blackQueenside: "Black queenside (O-O-O)",
		sparePieces: "Spare pieces",

		recordMoves: "Record moves",
		startRecording: "Start recording",
		stopRecording: "Stop recording",
		clearMoves: "Clear moves",

		step: "Step",
		nextStep: "Next step",
		prevStep: "Previous step",
		finishLecture: "Finish lecture",
		teacherNotes: "Coach notes",
	},
} as const;

export type TranslationKey = keyof typeof DICTIONARY.vi;

let currentLanguage: SupportedLanguage = "vi";

export function setLanguage(lang: SupportedLanguage): void {
	currentLanguage = lang;
}

export function getLanguage(): SupportedLanguage {
	return currentLanguage;
}

export function t(key: TranslationKey, lang?: SupportedLanguage): string {
	const activeLang = lang || currentLanguage;
	const dict = DICTIONARY[activeLang] || DICTIONARY.vi;
	return dict[key] || DICTIONARY.vi[key] || key;
}
