import { Badge, Button, Input, InputArea, Select } from "@cloudflare/kumo";
import { parsePgn, validateFen } from "@duongsinh/chess-kit/core";
import { Board, PgnViewer, PositionEditor } from "@duongsinh/chess-kit/react";
import type { PluginAdminExports } from "emdash";
import React, { useState, useMemo, useCallback } from "react";

// =============================================================================
// Helper Types & Parsers
// =============================================================================

export interface ChessBoardValueObject {
	fen?: string;
	pgn?: string;
	orientation?: "white" | "black";
	caption?: string;
	arrows?: string;
	highlights?: string;
}

export interface ChessWidgetProps {
	value?: unknown;
	onChange?: (val: unknown) => void;
	options?: {
		mode?: "fen" | "pgn";
	};
}

function parseInitialValue(value: unknown): {
	fen: string;
	pgn: string;
	orientation: "white" | "black";
	isObjectFormat: boolean;
} {
	if (value && typeof value === "object" && !Array.isArray(value)) {
		const obj = value as Record<string, unknown>;
		return {
			fen:
				typeof obj.fen === "string"
					? obj.fen
					: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
			pgn: typeof obj.pgn === "string" ? obj.pgn : "",
			orientation: obj.orientation === "black" ? "black" : "white",
			isObjectFormat: true,
		};
	}

	if (typeof value === "string" && value.trim().length > 0) {
		const str = value.trim();
		// Nếu chứa dấu ngoặc vuông tag header PGN hoặc dấu chấm nước cờ PGN thì xem là PGN
		if (str.startsWith("[") || (str.includes("1.") && !str.includes("/"))) {
			return {
				fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
				pgn: str,
				orientation: "white",
				isObjectFormat: false,
			};
		}
		// Ngược lại xem là chuỗi FEN
		return {
			fen: str,
			pgn: "",
			orientation: "white",
			isObjectFormat: false,
		};
	}

	return {
		fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
		pgn: "",
		orientation: "white",
		isObjectFormat: false,
	};
}

// =============================================================================
// Field Widget
// =============================================================================

export function ChessWidget({ value, onChange, options }: ChessWidgetProps) {
	const initial = useMemo(() => parseInitialValue(value), [value]);
	const mode = options?.mode || (initial.pgn ? "pgn" : "fen");

	const [activeMode, setActiveMode] = useState<"fen" | "pgn">(mode);
	const [currentFen, setCurrentFen] = useState(initial.fen);
	const [currentPgn, setCurrentPgn] = useState(initial.pgn);
	const [orientation, setOrientation] = useState<"white" | "black">(initial.orientation);

	const handleFenChange = useCallback(
		(newFen: string) => {
			setCurrentFen(newFen);
			if (!onChange) return;

			if (initial.isObjectFormat) {
				onChange({
					fen: newFen,
					pgn: currentPgn,
					orientation,
				});
			} else {
				onChange(newFen);
			}
		},
		[onChange, initial.isObjectFormat, currentPgn, orientation],
	);

	const handlePgnChange = useCallback(
		(newPgn: string) => {
			setCurrentPgn(newPgn);
			if (!onChange) return;

			if (initial.isObjectFormat) {
				onChange({
					fen: currentFen,
					pgn: newPgn,
					orientation,
				});
			} else {
				onChange(newPgn);
			}
		},
		[onChange, initial.isObjectFormat, currentFen, orientation],
	);

	const handleOrientationChange = useCallback(
		(newOrientation: "white" | "black") => {
			setOrientation(newOrientation);
			if (!onChange) return;

			if (initial.isObjectFormat) {
				onChange({
					fen: currentFen,
					pgn: currentPgn,
					orientation: newOrientation,
				});
			}
		},
		[onChange, initial.isObjectFormat, currentFen, currentPgn],
	);

	return (
		<div className="space-y-4 p-4 rounded-lg border border-kumo-line bg-kumo-surface">
			<div className="flex items-center justify-between gap-2 border-b border-kumo-line pb-3">
				<div className="flex gap-2">
					<Button
						variant={activeMode === "fen" ? "primary" : "secondary"}
						onClick={() => setActiveMode("fen")}
					>
						Thế cờ (FEN)
					</Button>
					<Button
						variant={activeMode === "pgn" ? "primary" : "secondary"}
						onClick={() => setActiveMode("pgn")}
					>
						Ván cờ (PGN)
					</Button>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-xs text-kumo-subtle">Góc nhìn:</span>
					<Select
						value={orientation}
						onValueChange={(v) => handleOrientationChange((v as "white" | "black") || "white")}
						items={[
							{ value: "white", label: "Trắng" },
							{ value: "black", label: "Đen" },
						]}
					/>
				</div>
			</div>

			{activeMode === "fen" ? (
				<div className="space-y-3">
					<PositionEditor initialFen={currentFen} onChange={handleFenChange} width={360} />
					<div className="text-xs font-mono text-kumo-subtle break-all p-2 rounded bg-kumo-subtle/10 border border-kumo-line">
						{currentFen}
					</div>
				</div>
			) : (
				<div className="space-y-3">
					<InputArea
						value={currentPgn}
						onChange={(e) => handlePgnChange(e.target.value)}
						placeholder="Dán hoặc nhập chuỗi PGN vào đây (vd: 1. e4 e5 2. Nf3 Nc6...)"
						rows={4}
						className="font-mono text-xs"
					/>
					{currentPgn.trim() && (
						<div className="mt-2">
							<PgnViewer
								pgn={currentPgn}
								orientation={orientation}
								width={400}
								showHeaders={false}
							/>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

// =============================================================================
// Admin Page (/editor) - Trình Quản Trị & Khảo Sát Bàn Cờ
// =============================================================================

export function ChessEditorPage() {
	const [activeTab, setActiveTab] = useState<"fen" | "pgn">("fen");
	const [fen, setFen] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
	const [pgn, setPgn] = useState(`[Event "Ván cờ mẫu"]
[Site "Cờ Vua Học Đường"]
[Date "2026.10.09"]
[White "Học viên Trắng"]
[Black "Học viên Đen"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 *`);

	const [arrows, setArrows] = useState("");
	const [highlights, setHighlights] = useState("");
	const [caption, setCaption] = useState("");
	const [orientation, setOrientation] = useState<"white" | "black">("white");
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const fenValidation = useMemo(() => validateFen(fen), [fen]);
	const pgnParsed = useMemo(() => {
		try {
			return parsePgn(pgn);
		} catch {
			return null;
		}
	}, [pgn]);

	const copyToClipboard = useCallback(async (text: string, fieldName: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(fieldName);
			setTimeout(setCopiedField, 2000, null);
		} catch {
			// ignore copy error
		}
	}, []);

	// Tạo nhanh chuỗi cấu hình Portable Text Block
	const jsonBlockFen = useMemo(() => {
		return JSON.stringify(
			{
				_type: "chess-fen",
				fen,
				orientation,
				caption: caption || undefined,
				arrows: arrows || undefined,
				highlights: highlights || undefined,
			},
			null,
			2,
		);
	}, [fen, orientation, caption, arrows, highlights]);

	const jsonBlockPgn = useMemo(() => {
		return JSON.stringify(
			{
				_type: "chess-pgn",
				pgn,
				orientation,
				caption: caption || undefined,
				showHeaders: true,
			},
			null,
			2,
		);
	}, [pgn, orientation, caption]);

	return (
		<div className="p-6 max-w-6xl mx-auto space-y-6">
			{/* Tiêu đề trang */}
			<div className="flex flex-wrap items-center justify-between gap-4 border-b border-kumo-line pb-4">
				<div>
					<h1 className="text-2xl font-bold text-kumo-brand">Trình Soạn Thảo & Khảo Sát Bàn Cờ</h1>
					<p className="text-sm text-kumo-subtle mt-1">
						Công cụ xếp thế cờ FEN, phân tích diễn biến PGN, tạo mũi tên chỉ dẫn và sao chép cấu
						hình khối cho bài viết.
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant={activeTab === "fen" ? "primary" : "secondary"}
						onClick={() => setActiveTab("fen")}
					>
						Xếp thế cờ (FEN)
					</Button>
					<Button
						variant={activeTab === "pgn" ? "primary" : "secondary"}
						onClick={() => setActiveTab("pgn")}
					>
						Ván cờ (PGN)
					</Button>
				</div>
			</div>

			{/* Nội dung Tab FEN */}
			{activeTab === "fen" && (
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
					{/* Cột trái: Trình xếp thế cờ PositionEditor */}
					<div className="lg:col-span-7 space-y-4">
						<div className="p-4 rounded-xl border border-kumo-line bg-kumo-surface shadow-sm">
							<div className="flex items-center justify-between mb-3">
								<h2 className="font-semibold text-base">Bàn Cờ Xếp Thế</h2>
								<div className="flex items-center gap-2">
									<Button
										variant="secondary"
										onClick={() => setOrientation((o) => (o === "white" ? "black" : "white"))}
									>
										Xoay bàn cờ: {orientation === "white" ? "Trắng" : "Đen"}
									</Button>
								</div>
							</div>
							<PositionEditor initialFen={fen} onChange={(newFen) => setFen(newFen)} width={480} />
						</div>

						{/* Xem trước với Mũi tên & Tô sáng */}
						{(arrows || highlights) && (
							<div className="p-4 rounded-xl border border-kumo-line bg-kumo-surface space-y-2">
								<h3 className="font-semibold text-sm">Xem trước hiệu ứng trực quan:</h3>
								<Board
									fen={fen}
									orientation={orientation}
									arrows={arrows}
									highlights={highlights}
									size={380}
								/>
							</div>
						)}
					</div>

					{/* Cột phải: Thông số, Mũi tên và Nút Copy */}
					<div className="lg:col-span-5 space-y-5">
						<div className="p-5 rounded-xl border border-kumo-line bg-kumo-surface space-y-4 shadow-sm">
							<div>
								<div className="flex items-center justify-between mb-1.5">
									<label className="font-semibold text-sm">Chuỗi FEN:</label>
									<Badge variant={fenValidation.valid ? "primary" : "secondary"}>
										{fenValidation.valid ? "Hợp lệ" : "Không hợp lệ"}
									</Badge>
								</div>
								<InputArea
									value={fen}
									onChange={(e) => setFen(e.target.value)}
									className="font-mono text-xs"
									rows={2}
								/>
								{!fenValidation.valid && (
									<p className="text-xs text-red-500 mt-1">{fenValidation.error}</p>
								)}
								<div className="mt-2 flex justify-end">
									<Button variant="secondary" onClick={() => copyToClipboard(fen, "fen")}>
										{copiedField === "fen" ? "Đã sao chép FEN!" : "Sao chép FEN"}
									</Button>
								</div>
							</div>

							<div className="border-t border-kumo-line pt-4 space-y-3">
								<h3 className="font-semibold text-sm">Mũi tên & Ô tô sáng (Tùy chọn)</h3>
								<div>
									<label className="block text-xs text-kumo-subtle mb-1">
										Mũi tên chỉ dẫn (vd: <code>e2e4 g1f3:red f1c4:green</code>):
									</label>
									<Input
										value={arrows}
										onChange={(e) => setArrows(e.target.value)}
										placeholder="e2e4 g1f3:red"
										className="font-mono text-xs"
									/>
									<div className="mt-1 flex justify-end">
										<Button
											variant="secondary"
											onClick={() => copyToClipboard(arrows, "arrows")}
											disabled={!arrows}
										>
											{copiedField === "arrows" ? "Đã sao chép Mũi tên!" : "Sao chép Mũi tên"}
										</Button>
									</div>
								</div>

								<div>
									<label className="block text-xs text-kumo-subtle mb-1">
										Ô tô sáng (vd: <code>e4 d5:red e5:green</code>):
									</label>
									<Input
										value={highlights}
										onChange={(e) => setHighlights(e.target.value)}
										placeholder="e4 d5"
										className="font-mono text-xs"
									/>
								</div>

								<div>
									<label className="block text-xs text-kumo-subtle mb-1">Chú thích thế cờ:</label>
									<Input
										value={caption}
										onChange={(e) => setCaption(e.target.value)}
										placeholder="Ví dụ: Trắng đi trước và giành ưu thế quyết định"
									/>
								</div>
							</div>

							<div className="border-t border-kumo-line pt-4 space-y-2">
								<h3 className="font-semibold text-sm">Cấu hình Portable Text Block</h3>
								<InputArea
									readOnly
									value={jsonBlockFen}
									rows={4}
									className="font-mono text-xs bg-kumo-subtle/5"
								/>
								<div className="flex justify-end">
									<Button
										variant="primary"
										onClick={() => copyToClipboard(jsonBlockFen, "block-fen")}
									>
										{copiedField === "block-fen"
											? "Đã sao chép JSON Block!"
											: "Sao chép JSON Block"}
									</Button>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Nội dung Tab PGN */}
			{activeTab === "pgn" && (
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
					{/* Cột trái: Nhập và Chỉnh sửa PGN */}
					<div className="lg:col-span-5 space-y-4">
						<div className="p-5 rounded-xl border border-kumo-line bg-kumo-surface shadow-sm space-y-4">
							<div className="flex items-center justify-between">
								<h2 className="font-semibold text-base">Dữ Liệu PGN</h2>
								<Badge variant={pgnParsed ? "primary" : "secondary"}>
									{pgnParsed ? "Đã phân tích PGN" : "PGN chưa hợp lệ"}
								</Badge>
							</div>

							<InputArea
								value={pgn}
								onChange={(e) => setPgn(e.target.value)}
								rows={8}
								className="font-mono text-xs"
								placeholder="Dán chuỗi PGN đầy đủ gồm Header và Moves..."
							/>

							<div>
								<label className="block text-xs text-kumo-subtle mb-1">Chú thích ván cờ:</label>
								<Input
									value={caption}
									onChange={(e) => setCaption(e.target.value)}
									placeholder="Ví dụ: Ván đấu bất hủ năm 1999"
								/>
							</div>

							<div className="flex flex-wrap gap-2 justify-end">
								<Button variant="secondary" onClick={() => copyToClipboard(pgn, "pgn")}>
									{copiedField === "pgn" ? "Đã sao chép PGN!" : "Sao chép PGN"}
								</Button>
								<Button
									variant="primary"
									onClick={() => copyToClipboard(jsonBlockPgn, "block-pgn")}
								>
									{copiedField === "block-pgn" ? "Đã sao chép JSON Block!" : "Sao chép JSON Block"}
								</Button>
							</div>
						</div>

						{/* Chi tiết Header đã phân tích */}
						{pgnParsed && Object.keys(pgnParsed.headers).length > 0 && (
							<div className="p-4 rounded-xl border border-kumo-line bg-kumo-surface text-xs space-y-1">
								<h4 className="font-semibold text-kumo-brand mb-2">Thông tin Headers:</h4>
								{Object.entries(pgnParsed.headers).map(([k, v]) => (
									<div key={k} className="flex justify-between py-0.5 border-b border-kumo-line/50">
										<span className="text-kumo-subtle">{k}:</span>
										<span className="font-medium text-end">{v}</span>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Cột phải: Xem trước PgnViewer */}
					<div className="lg:col-span-7 space-y-4">
						<div className="p-5 rounded-xl border border-kumo-line bg-kumo-surface shadow-sm">
							<h2 className="font-semibold text-base mb-3">
								Xem Trước & Duyệt Nước Đi (PgnViewer)
							</h2>
							<PgnViewer pgn={pgn} orientation={orientation} showHeaders={true} caption={caption} />
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

// =============================================================================
// Exports
// =============================================================================

export const fields: PluginAdminExports["fields"] = {
	"chess-board": ChessWidget,
};

export const pages: PluginAdminExports["pages"] = {
	"/editor": ChessEditorPage,
};
