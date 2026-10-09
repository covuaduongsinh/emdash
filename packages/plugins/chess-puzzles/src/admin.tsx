import { Badge, Button, InputArea } from "@cloudflare/kumo";
import { LEVELS, type ChessLevel, validateFen } from "@duongsinh/chess-kit/core";
import { MoveRecorder, PositionEditor, PuzzlePlayer } from "@duongsinh/chess-kit/react";
import React, { useState, useMemo, useCallback, useEffect } from "react";

import type { PuzzleData, PuzzleImportResult } from "./types.js";

const WHITESPACE_SPLIT_REGEX = /\s+/;

// =============================================================================
// Helper Parsers
// =============================================================================

function parseInitialPuzzleValue(value: unknown): PuzzleData {
	if (value && typeof value === "object" && !Array.isArray(value)) {
		const obj = value as Record<string, unknown>;
		const fen =
			typeof obj.fen === "string"
				? obj.fen
				: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
		const moves = Array.isArray(obj.moves)
			? (obj.moves as string[])
			: Array.isArray(obj.solution)
				? (obj.solution as string[])
				: typeof obj.solution === "string"
					? (obj.solution as string).split(WHITESPACE_SPLIT_REGEX).filter(Boolean)
					: [];
		const orientation = obj.orientation === "black" ? "black" : "white";

		return {
			fen,
			moves,
			solution: moves,
			orientation,
		};
	}

	if (typeof value === "string" && value.trim().length > 0) {
		return {
			fen: value.trim(),
			moves: [],
			solution: [],
			orientation: "white",
		};
	}

	return {
		fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
		moves: [],
		solution: [],
		orientation: "white",
	};
}

// =============================================================================
// Field Widget: PuzzleEditorWidget
// =============================================================================

export interface PuzzleEditorWidgetProps {
	value?: unknown;
	onChange?: (val: unknown) => void;
}

export function PuzzleEditorWidget({ value, onChange }: PuzzleEditorWidgetProps) {
	const initial = useMemo(() => parseInitialPuzzleValue(value), [value]);

	const [activeTab, setActiveTab] = useState<"fen" | "record" | "test">("fen");
	const [currentFen, setCurrentFen] = useState(initial.fen);
	const [currentMoves, setCurrentMoves] = useState<string[]>(initial.moves || []);
	const [orientation, setOrientation] = useState<"white" | "black">(initial.orientation || "white");

	const isFenValid = useMemo(() => validateFen(currentFen), [currentFen]);

	const updateValue = useCallback(
		(fen: string, moves: string[], orient: "white" | "black") => {
			if (!onChange) return;
			onChange({
				fen,
				moves,
				solution: moves,
				orientation: orient,
			});
		},
		[onChange],
	);

	const handleFenChange = useCallback(
		(newFen: string) => {
			setCurrentFen(newFen);
			const turn = newFen.split(" ")[1] === "b" ? "black" : "white";
			setOrientation(turn);
			updateValue(newFen, currentMoves, turn);
		},
		[currentMoves, updateValue],
	);

	const handleMovesChange = useCallback(
		(newMoves: string[]) => {
			setCurrentMoves(newMoves);
			updateValue(currentFen, newMoves, orientation);
		},
		[currentFen, orientation, updateValue],
	);

	return (
		<div className="rounded-lg border border-kumo-border bg-kumo-surface p-4">
			{/* Tab Switcher */}
			<div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-kumo-border pb-3">
				<div className="flex gap-2">
					<Button
						variant={activeTab === "fen" ? "primary" : "secondary"}
						size="sm"
						onClick={() => setActiveTab("fen")}
					>
						1. Xếp thế cờ (FEN)
					</Button>
					<Button
						variant={activeTab === "record" ? "primary" : "secondary"}
						size="sm"
						onClick={() => setActiveTab("record")}
					>
						2. Ghi nước giải ({currentMoves.length} nước)
					</Button>
					<Button
						variant={activeTab === "test" ? "primary" : "secondary"}
						size="sm"
						onClick={() => setActiveTab("test")}
					>
						3. Chạy thử câu đố
					</Button>
				</div>

				<Badge variant={isFenValid ? "success" : "error"}>
					{isFenValid ? "FEN hợp lệ" : "FEN không hợp lệ"}
				</Badge>
			</div>

			{/* Tab 1: Xếp thế FEN */}
			{activeTab === "fen" && (
				<div className="space-y-4">
					<p className="text-xs text-kumo-subtle">
						Kéo thả quân cờ hoặc chọn quân dự bị để thiết lập thế cờ bắt đầu câu đố.
					</p>
					<PositionEditor initialFen={currentFen} onChange={handleFenChange} width={440} />
					<div className="mt-2 flex items-center gap-2">
						<span className="text-xs text-kumo-subtle">Góc nhìn:</span>
						<Button
							size="xs"
							variant={orientation === "white" ? "primary" : "secondary"}
							onClick={() => {
								setOrientation("white");
								updateValue(currentFen, currentMoves, "white");
							}}
						>
							Trắng
						</Button>
						<Button
							size="xs"
							variant={orientation === "black" ? "primary" : "secondary"}
							onClick={() => {
								setOrientation("black");
								updateValue(currentFen, currentMoves, "black");
							}}
						>
							Đen
						</Button>
					</div>
				</div>
			)}

			{/* Tab 2: Ghi nước giải */}
			{activeTab === "record" && (
				<div className="space-y-4">
					<p className="text-xs text-kumo-subtle">
						Đi thử các nước đi đúng trên bàn cờ. Nếu câu đố gồm nhiều nước, hãy đi cả nước đáp của
						đối thủ.
					</p>
					<MoveRecorder
						fen={currentFen}
						initialMoves={currentMoves}
						onChange={handleMovesChange}
						orientation={orientation}
						width={440}
					/>
				</div>
			)}

			{/* Tab 3: Chạy thử câu đố */}
			{activeTab === "test" && (
				<div className="space-y-4">
					<p className="text-xs text-kumo-subtle">
						Trải nghiệm giải câu đố như học viên thực tế để kiểm tra tính chính xác.
					</p>
					{currentMoves.length === 0 ? (
						<div className="rounded border border-kumo-warning bg-kumo-surface p-3 text-xs text-kumo-warning">
							Chưa có nước giải nào được ghi lại. Vui lòng qua tab "2. Ghi nước giải" để thực hiện
							nước đi đúng.
						</div>
					) : (
						<PuzzlePlayer
							fen={currentFen}
							solution={currentMoves}
							orientation={orientation}
							width={440}
						/>
					)}
				</div>
			)}
		</div>
	);
}

// =============================================================================
// Admin Page 1: Puzzles Overview (/puzzles)
// =============================================================================

export function PuzzlesAdminPage() {
	const [stats, setStats] = useState<{ total: number; levels: Record<string, number> }>({
		total: 0,
		levels: { tot: 0, ma: 0, tuong: 0, xe: 0, hau: 0, vua: 0 },
	});
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	const fetchStats = useCallback(async () => {
		try {
			const res = await fetch("/_emdash/api/plugins/chess-puzzles/puzzles/stats", {
				headers: { "X-EmDash-Request": "1" },
			});
			if (res.ok) {
				const data = await res.json();
				setStats(data);
			}
		} catch {
			// Bỏ qua lỗi
		}
	}, []);

	useEffect(() => {
		fetchStats();
	}, [fetchStats]);

	const handleSetupRun = async () => {
		setLoading(true);
		setMessage(null);
		try {
			const res = await fetch("/_emdash/api/plugins/chess-puzzles/setup/run", {
				method: "POST",
				headers: {
					"X-EmDash-Request": "1",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({}),
			});
			if (res.ok) {
				setMessage("Đồng bộ CSDL thành công!");
				fetchStats();
			} else {
				setMessage("Lỗi khi chạy cài đặt CSDL.");
			}
		} catch {
			setMessage("Không thể kết nối máy chủ.");
		} finally {
			setLoading(false);
		}
	};

	const handleRefreshSnapshots = async () => {
		setLoading(true);
		setMessage(null);
		try {
			const res = await fetch("/_emdash/api/plugins/chess-puzzles/snapshots/refresh", {
				method: "POST",
				headers: {
					"X-EmDash-Request": "1",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({}),
			});
			if (res.ok) {
				const data = await res.json();
				setMessage(`Đã làm mới snapshot cho ${data.updatedCount || 0} vị trí nhúng.`);
			} else {
				setMessage("Lỗi làm mới snapshot.");
			}
		} catch {
			setMessage("Không thể kết nối máy chủ.");
		} finally {
			setLoading(false);
		}
	};

	const levelCards = useMemo(() => {
		return Object.keys(LEVELS).map((lvlKey) => {
			const info = LEVELS[lvlKey as ChessLevel["id"]];
			const count = stats.levels[lvlKey] || 0;
			return {
				id: lvlKey,
				nameVi: info.nameVi,
				color: info.color,
				count,
				desc: info.description,
			};
		});
	}, [stats]);

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-kumo-foreground">Quản Lý Câu Đố Cờ Vua</h1>
					<p className="text-sm text-kumo-subtle">
						Ngân hàng câu đố phân bổ theo 6 cấp độ cờ vua Dương Sinh
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="secondary" onClick={handleRefreshSnapshots} disabled={loading}>
						Làm mới Snapshot
					</Button>
					<Button variant="primary" onClick={handleSetupRun} disabled={loading}>
						{loading ? "Đang xử lý..." : "Cài đặt CSDL (Setup)"}
					</Button>
				</div>
			</div>

			{message && (
				<div className="rounded-md border border-kumo-info bg-kumo-surface p-3 text-sm text-kumo-info">
					{message}
				</div>
			)}

			{/* Thống kê 6 cấp độ */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{levelCards.map((card) => (
					<div
						key={card.id}
						className="rounded-lg border border-kumo-border bg-kumo-surface p-4 shadow-sm"
					>
						<div className="flex items-center justify-between">
							<span
								className="inline-block rounded px-2 py-0.5 text-xs font-semibold text-white"
								style={{ backgroundColor: card.color }}
							>
								{card.nameVi}
							</span>
							<span className="text-xl font-bold text-kumo-foreground">{card.count} câu</span>
						</div>
						<p className="mt-2 text-xs text-kumo-subtle">{card.desc}</p>
					</div>
				))}
			</div>

			<div className="rounded-lg border border-kumo-border bg-kumo-surface p-6">
				<h2 className="text-base font-semibold text-kumo-foreground">Hướng Dẫn Nhanh</h2>
				<ul className="mt-3 list-inside list-disc space-y-2 text-sm text-kumo-subtle">
					<li>
						Truy cập mục <strong>"Nội dung" &rarr; "Kho câu đố"</strong> để tạo, sửa hoặc xem chi
						tiết từng câu đố.
					</li>
					<li>
						Vào mục <strong>"Nhập câu đố"</strong> trên thanh menu để nạp hàng loạt từ file Lichess
						CSV, EPD hoặc PGN.
					</li>
					<li>
						Khi chèn câu đố vào bài giảng LMS qua khối <code>chess-puzzle</code>, hệ thống sẽ tự
						động snapshot nội dung câu đố khi lưu bài viết (trang công khai khách xem không phát
						sinh query database).
					</li>
				</ul>
			</div>
		</div>
	);
}

// =============================================================================
// Admin Page 2: Puzzles Importer (/import)
// =============================================================================

export function PuzzlesImportPage() {
	const [format, setFormat] = useState<"csv" | "epd" | "pgn">("csv");
	const [data, setData] = useState("");
	const [defaultLevel, setDefaultLevel] = useState<string>("tot");
	const [autoPublish, setAutoPublish] = useState(true);
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<PuzzleImportResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			const content = event.target?.result;
			if (typeof content === "string") {
				setData(content);
			}
		};
		reader.readAsText(file);
	};

	const handleImport = async () => {
		if (!data.trim()) {
			setError("Vui lòng dán dữ liệu hoặc chọn file tải lên.");
			return;
		}

		setLoading(true);
		setError(null);
		setResult(null);

		try {
			const res = await fetch("/_emdash/api/plugins/chess-puzzles/puzzles/import", {
				method: "POST",
				headers: {
					"X-EmDash-Request": "1",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					format,
					data,
					defaultLevel,
					autoPublish,
				}),
			});

			const body = await res.json();
			if (res.ok) {
				setResult(body);
			} else {
				setError(body.error?.message || "Nhập câu đố thất bại.");
			}
		} catch (err) {
			setError("Không thể kết nối máy chủ: " + (err instanceof Error ? err.message : String(err)));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-2xl font-bold text-kumo-foreground">Nhập Câu Đố Hàng Loạt</h1>
				<p className="text-sm text-kumo-subtle">
					Hỗ trợ nạp câu đố từ Lichess CSV, định dạng chuẩn EPD và file ván cờ PGN (tối đa 500
					câu/lô)
				</p>
			</div>

			<div className="rounded-lg border border-kumo-border bg-kumo-surface p-6 space-y-4">
				<div className="flex flex-wrap gap-3">
					<Button
						variant={format === "csv" ? "primary" : "secondary"}
						size="sm"
						onClick={() => setFormat("csv")}
					>
						Lichess CSV
					</Button>
					<Button
						variant={format === "epd" ? "primary" : "secondary"}
						size="sm"
						onClick={() => setFormat("epd")}
					>
						EPD (Extended Position Description)
					</Button>
					<Button
						variant={format === "pgn" ? "primary" : "secondary"}
						size="sm"
						onClick={() => setFormat("pgn")}
					>
						PGN ván cờ có [FEN]
					</Button>
				</div>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div>
						<label className="block text-xs font-semibold text-kumo-foreground mb-1">
							Cấp độ mặc định (nếu không có Elo):
						</label>
						<select
							className="w-full rounded border border-kumo-border bg-kumo-surface p-2 text-sm text-kumo-foreground"
							value={defaultLevel}
							onChange={(e) => setDefaultLevel(e.target.value)}
						>
							<option value="tot">Cấp Tốt (Khởi đầu - Elo &lt; 1000)</option>
							<option value="ma">Cấp Mã (Nhập môn - Elo 1000..1299)</option>
							<option value="tuong">Cấp Tượng (Trung cấp - Elo 1300..1599)</option>
							<option value="xe">Cấp Xe (Tiên tiến - Elo 1600..1899)</option>
							<option value="hau">Cấp Hậu (Chuyên sâu - Elo 1900..2199)</option>
							<option value="vua">Cấp Vua (Bậc thầy - Elo &ge; 2200)</option>
						</select>
					</div>

					<div className="flex items-center gap-2 pt-5">
						<label className="flex items-center gap-2 text-sm text-kumo-foreground cursor-pointer">
							<input
								type="checkbox"
								checked={autoPublish}
								onChange={(e) => setAutoPublish(e.target.checked)}
								className="rounded border-kumo-border text-kumo-brand"
							/>
							Tự động xuất bản (Published) ngay sau khi nhập
						</label>
					</div>
				</div>

				<div>
					<label className="block text-xs font-semibold text-kumo-foreground mb-1">
						Chọn file để tải lên:
					</label>
					<input
						type="file"
						accept=".csv,.txt,.epd,.pgn"
						onChange={handleFileUpload}
						className="block w-full text-sm text-kumo-subtle file:me-4 file:rounded file:border-0 file:bg-kumo-brand file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-kumo-brand-hover"
					/>
				</div>

				<div>
					<label className="block text-xs font-semibold text-kumo-foreground mb-1">
						Hoặc dán nội dung văn bản:
					</label>
					<InputArea
						rows={8}
						value={data}
						onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData(e.target.value)}
						placeholder={
							format === "csv"
								? "PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags\n..."
								: format === "epd"
									? 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3 bm Nxe5; id "Test1";\n...'
									: '[Event "..."]\n[FEN "..."]\n1. e4 e5...'
						}
					/>
				</div>

				{error && (
					<div className="rounded border border-kumo-danger bg-kumo-surface p-3 text-sm text-kumo-danger">
						{error}
					</div>
				)}

				<Button variant="primary" onClick={handleImport} disabled={loading}>
					{loading ? "Đang xử lý nhập câu đố..." : "Bắt đầu nhập dữ liệu"}
				</Button>
			</div>

			{/* Kết quả nhập */}
			{result && (
				<div className="rounded-lg border border-kumo-border bg-kumo-surface p-6 space-y-3">
					<h3 className="text-lg font-bold text-kumo-foreground">Kết Quả Nhập Dữ Liệu</h3>
					<div className="flex gap-4 text-sm">
						<span className="text-kumo-foreground">
							Tổng số câu phân tích: <strong>{result.totalParsed}</strong>
						</span>
						<span className="text-kumo-success">
							Đã lưu thành công: <strong>{result.imported}</strong>
						</span>
						{result.errors.length > 0 && (
							<span className="text-kumo-danger">
								Lỗi: <strong>{result.errors.length}</strong>
							</span>
						)}
					</div>

					{result.errors.length > 0 && (
						<div className="mt-3 max-h-60 overflow-y-auto rounded border border-kumo-border bg-kumo-surface p-3 text-xs">
							<h4 className="font-semibold text-kumo-danger mb-2">Chi tiết các dòng lỗi:</h4>
							<ul className="space-y-1 text-kumo-subtle">
								{result.errors.map((err, idx) => (
									<li key={idx}>
										Dòng {err.line}: {err.error}
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

// =============================================================================
// Export named widgets and pages
// =============================================================================

export const fields = {
	"puzzle-editor": PuzzleEditorWidget,
	"chess-puzzles:puzzle-editor": PuzzleEditorWidget,
};

export const pages = {
	"/puzzles": PuzzlesAdminPage,
	"/import": PuzzlesImportPage,
};
