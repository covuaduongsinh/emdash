export interface TacticalTheme {
	id: string;
	nameVi: string;
	nameEn: string;
	category: "tactics" | "strategy" | "endgame" | "opening" | "mate";
	description: string;
}

export const THEMES: Record<string, TacticalTheme> = {
	fork: {
		id: "fork",
		nameVi: "Bắt đôi (Đòn chĩa)",
		nameEn: "Fork",
		category: "tactics",
		description: "Một quân tấn công đồng thời hai hay nhiều quân của đối phương.",
	},
	pin: {
		id: "pin",
		nameVi: "Ghim quân (Đòn giằng)",
		nameEn: "Pin",
		category: "tactics",
		description: "Tấn công một quân che chắn phía trước một quân có giá trị lớn hơn hoặc Vua.",
	},
	skewer: {
		id: "skewer",
		nameVi: "Đòn xiên",
		nameEn: "Skewer",
		category: "tactics",
		description:
			"Tấn công quân có giá trị cao phía trước, buộc đối phương chạy để lộ quân phía sau.",
	},
	discovered_attack: {
		id: "discovered_attack",
		nameVi: "Đòn mở (Tấn công mở)",
		nameEn: "Discovered Attack",
		category: "tactics",
		description: "Di chuyển một quân để mở đường tấn công cho một quân khác phía sau.",
	},
	double_check: {
		id: "double_check",
		nameVi: "Chiếu đôi",
		nameEn: "Double Check",
		category: "tactics",
		description: "Chiếu Vua bằng hai quân cùng lúc thông qua đòn mở, bắt buộc Vua phải chạy.",
	},
	back_rank_mate: {
		id: "back_rank_mate",
		nameVi: "Chiếu hết hàng cuối",
		nameEn: "Back Rank Mate",
		category: "mate",
		description: "Chiếu hết Vua ở hàng ngang 1 hoặc 8 khi Vua bị chắn bởi các quân Tốt của mình.",
	},
	smothered_mate: {
		id: "smothered_mate",
		nameVi: "Chiếu hết thắt cổ chai",
		nameEn: "Smothered Mate",
		category: "mate",
		description: "Mã chiếu hết Vua khi Vua bị vây kín hoàn toàn bởi chính quân mình.",
	},
	scholars_mate: {
		id: "scholars_mate",
		nameVi: "Chiếu hết Scholar (Bắt tốt f7/f2)",
		nameEn: "Scholar's Mate",
		category: "mate",
		description: "Phối hợp Hậu và Tượng tấn công điểm yếu f7/f2 trong khai cuộc.",
	},
	deflection: {
		id: "deflection",
		nameVi: "Đòn thu hút / Đánh lạc hướng",
		nameEn: "Deflection / Attraction",
		category: "tactics",
		description: "Buộc quân phòng thủ của đối phương phải rời bỏ vị trí quan trọng.",
	},
	overloading: {
		id: "overloading",
		nameVi: "Quá tải quân phòng thủ",
		nameEn: "Overloading",
		category: "tactics",
		description: "Khai thác quân cờ đối phương đang phải gánh vác quá nhiều nhiệm vụ bảo vệ.",
	},
	promotion: {
		id: "promotion",
		nameVi: "Phong cấp tốt",
		nameEn: "Pawn Promotion",
		category: "endgame",
		description: "Chiến thuật đưa Tốt đến hàng cuối cùng để phong Hậu hoặc quân khác.",
	},
	hanging_piece: {
		id: "hanging_piece",
		nameVi: "Bắt quân không được bảo vệ",
		nameEn: "Hanging Piece",
		category: "tactics",
		description: "Ăn quân đối phương để hớ hoặc quên bảo vệ.",
	},
};

export const THEME_LIST: TacticalTheme[] = Object.values(THEMES);
