export interface ChessLevel {
	id: "tot" | "ma" | "tuong" | "xe" | "hau" | "vua";
	order: number;
	nameVi: string;
	nameEn: string;
	color: string;
	ratingRange: [number, number];
	description: string;
}

export const LEVELS: Record<ChessLevel["id"], ChessLevel> = {
	tot: {
		id: "tot",
		order: 1,
		nameVi: "Cấp Tốt (Khởi đầu)",
		nameEn: "Pawn Level (Beginner)",
		color: "#94a3b8",
		ratingRange: [0, 800],
		description: "Làm quen bàn cờ, cách đi và ăn quân của 6 loại quân, nước đi hợp lệ.",
	},
	ma: {
		id: "ma",
		order: 2,
		nameVi: "Cấp Mã (Nhập môn)",
		nameEn: "Knight Level (Novice)",
		color: "#10b981",
		ratingRange: [800, 1100],
		description: "Các đòn chiến thuật cơ bản: bắt đôi, chiếu bắt quân, ăn quân hơn.",
	},
	tuong: {
		id: "tuong",
		order: 3,
		nameVi: "Cấp Tượng (Trung cấp)",
		nameEn: "Bishop Level (Intermediate)",
		color: "#3b82f6",
		ratingRange: [1100, 1400],
		description: "Đòn gián tiếp: ghim quân, đòn mở, tấn công đường chéo và cánh.",
	},
	xe: {
		id: "xe",
		order: 4,
		nameVi: "Cấp Xe (Tiên tiến)",
		nameEn: "Rook Level (Advanced)",
		color: "#8b5cf6",
		ratingRange: [1400, 1700],
		description: "Chiếm cột mở, hàng ngang thứ 7, phối hợp xe và tàn cuộc cơ bản.",
	},
	hau: {
		id: "hau",
		order: 5,
		nameVi: "Cấp Hậu (Chuyên sâu)",
		nameEn: "Queen Level (Expert)",
		color: "#ec4899",
		ratingRange: [1700, 2000],
		description: "Tấn công vua tổng lực, phối hợp quân linh hoạt, kế hoạch trung cuộc.",
	},
	vua: {
		id: "vua",
		order: 6,
		nameVi: "Cấp Vua (Bậc thầy)",
		nameEn: "King Level (Master)",
		color: "#f59e0b",
		ratingRange: [2000, 2500],
		description: "Kỹ thuật tàn cuộc sâu sắc, an toàn vua và chiến lược toàn diện.",
	},
};

export const LEVEL_LIST: ChessLevel[] = Object.values(LEVELS).toSorted((a, b) => a.order - b.order);

export type ChessLevelId = keyof typeof LEVELS;
