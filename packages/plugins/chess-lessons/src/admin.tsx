import { Badge, Button, InputArea } from "@cloudflare/kumo";
import { LEVEL_LIST, validateFen } from "@duongsinh/chess-kit/core";
import { LecturePlayer, PositionEditor } from "@duongsinh/chess-kit/react";
import { apiFetch } from "emdash/plugin-utils";
import React, { useCallback, useMemo, useState } from "react";
import { ulid } from "ulidx";

import type {
	ChessLectureScript,
	CurriculumSeedResult,
	DemoDataSeedResult,
	LectureStep,
	ObsidianImportResult,
	SampleLessonSeedResult,
} from "./types.js";

// =============================================================================
// Helper Parser
// =============================================================================

function parseInitialScriptValue(value: unknown): ChessLectureScript {
	if (value && typeof value === "object" && !Array.isArray(value)) {
		const obj = value as Record<string, unknown>;
		if (Array.isArray(obj.steps)) {
			return { steps: obj.steps as LectureStep[] };
		}
	}

	if (typeof value === "string" && value.trim().length > 0) {
		try {
			const parsed = JSON.parse(value);
			if (parsed && Array.isArray(parsed.steps)) {
				return { steps: parsed.steps as LectureStep[] };
			}
		} catch {
			// Fallback
		}
	}

	return {
		steps: [
			{
				id: ulid(),
				title: "Bước 1: Thế cờ xuất phát",
				fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
				narration: "Chào mừng học viên đến với bài giảng cờ vua tương tác.",
				teacherNotes: "Ghi chú dành riêng cho Huấn Luyện Viên: Giới thiệu mục tiêu bài giảng.",
				orientation: "white",
			},
		],
	};
}

// =============================================================================
// Field Widget: LectureBuilderWidget
// =============================================================================

export interface LectureBuilderWidgetProps {
	value?: unknown;
	onChange?: (val: unknown) => void;
}

export function LectureBuilderWidget({ value, onChange }: LectureBuilderWidgetProps) {
	const initial = useMemo(() => parseInitialScriptValue(value), [value]);

	const [steps, setSteps] = useState<LectureStep[]>(initial.steps);
	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

	const currentStep = steps[currentStepIndex] || steps[0];

	const updateSteps = useCallback(
		(newSteps: LectureStep[]) => {
			setSteps(newSteps);
			if (onChange) {
				onChange({ steps: newSteps });
			}
		},
		[onChange],
	);

	const handleStepFieldChange = useCallback(
		(field: keyof LectureStep, val: unknown) => {
			const updated = [...steps];
			if (!updated[currentStepIndex]) return;
			updated[currentStepIndex] = {
				...updated[currentStepIndex],
				[field]: val,
			};
			updateSteps(updated);
		},
		[currentStepIndex, steps, updateSteps],
	);

	const handleAddStep = () => {
		const prevFen = currentStep?.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
		const newStep: LectureStep = {
			id: ulid(),
			title: `Bước ${steps.length + 1}`,
			fen: prevFen,
			narration: "",
			teacherNotes: "",
			orientation: currentStep?.orientation || "white",
		};
		const updated = [...steps, newStep];
		updateSteps(updated);
		setCurrentStepIndex(updated.length - 1);
	};

	const handleDeleteStep = (index: number) => {
		if (steps.length <= 1) return;
		const updated = steps.filter((_, i) => i !== index);
		updateSteps(updated);
		setCurrentStepIndex(Math.max(0, Math.min(currentStepIndex, updated.length - 1)));
	};

	const handleMoveStep = (fromIndex: number, toIndex: number) => {
		if (toIndex < 0 || toIndex >= steps.length) return;
		const updated = [...steps];
		const [moved] = updated.splice(fromIndex, 1);
		if (moved) {
			updated.splice(toIndex, 0, moved);
			updateSteps(updated);
			setCurrentStepIndex(toIndex);
		}
	};

	return (
		<div className="rounded-lg border border-kumo-border bg-kumo-surface p-4 space-y-4">
			{/* Header tabs */}
			<div className="flex items-center justify-between border-b border-kumo-border pb-3">
				<div className="flex gap-2">
					<Button
						variant={activeTab === "edit" ? "primary" : "secondary"}
						onClick={() => setActiveTab("edit")}
					>
						Soạn Kịch Bản ({steps.length} bước)
					</Button>
					<Button
						variant={activeTab === "preview" ? "primary" : "secondary"}
						onClick={() => setActiveTab("preview")}
					>
						Chạy Thử Bài Giảng
					</Button>
				</div>
				{activeTab === "edit" && (
					<Button variant="secondary" onClick={handleAddStep}>
						+ Thêm Bước Mới
					</Button>
				)}
			</div>

			{activeTab === "preview" ? (
				<div className="p-4 bg-kumo-subtle/10 rounded-lg">
					<LecturePlayer title="Xem trước bài giảng" steps={steps} showTeacherNotes={true} />
				</div>
			) : (
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
					{/* Danh sách các bước (Sidebar bên trái) */}
					<div className="lg:col-span-4 border-e border-kumo-border pe-4 space-y-2 max-h-128 overflow-y-auto">
						<h4 className="text-xs font-semibold text-kumo-subtle uppercase tracking-wider mb-2">
							Các bước trình chiếu
						</h4>
						{steps.map((step, idx) => (
							<div
								key={step.id || idx}
								onClick={() => setCurrentStepIndex(idx)}
								className={`p-2.5 rounded-md border cursor-pointer transition-colors text-sm flex items-center justify-between ${
									idx === currentStepIndex
										? "border-kumo-brand bg-kumo-brand/10 font-medium text-kumo-foreground"
										: "border-kumo-border bg-kumo-surface hover:bg-kumo-subtle/10 text-kumo-subtle"
								}`}
							>
								<div className="truncate flex-1 me-2">
									<span className="me-1.5 font-bold">#{idx + 1}</span>
									<span>{step.title || `Bước ${idx + 1}`}</span>
								</div>
								<div className="flex items-center gap-1">
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											handleMoveStep(idx, idx - 1);
										}}
										disabled={idx === 0}
										className="px-1 text-xs text-kumo-subtle hover:text-kumo-foreground disabled:opacity-30"
									>
										▲
									</button>
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											handleMoveStep(idx, idx + 1);
										}}
										disabled={idx === steps.length - 1}
										className="px-1 text-xs text-kumo-subtle hover:text-kumo-foreground disabled:opacity-30"
									>
										▼
									</button>
									{steps.length > 1 && (
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteStep(idx);
											}}
											className="px-1 text-xs text-kumo-danger hover:underline ms-1"
										>
											✕
										</button>
									)}
								</div>
							</div>
						))}
					</div>

					{/* Chi tiết bước đang chọn */}
					{currentStep && (
						<div className="lg:col-span-8 space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-xs font-semibold text-kumo-subtle mb-1">
										Tiêu đề bước
									</label>
									<input
										type="text"
										value={currentStep.title || ""}
										onChange={(e) => handleStepFieldChange("title", e.target.value)}
										className="w-full rounded-md border border-kumo-border bg-kumo-surface px-3 py-2 text-sm text-kumo-foreground"
										placeholder="Ví dụ: Bước 1: Nước đi đầu tiên e2-e4"
									/>
								</div>
								<div>
									<label className="block text-xs font-semibold text-kumo-subtle mb-1">
										Góc nhìn bàn cờ
									</label>
									<select
										value={currentStep.orientation || "white"}
										onChange={(e) =>
											handleStepFieldChange("orientation", e.target.value as "white" | "black")
										}
										className="w-full rounded-md border border-kumo-border bg-kumo-surface px-3 py-2 text-sm text-kumo-foreground"
									>
										<option value="white">Góc nhìn quân Trắng</option>
										<option value="black">Góc nhìn quân Đen</option>
									</select>
								</div>
							</div>

							{/* Bàn cờ chỉnh FEN */}
							<div>
								<div className="flex items-center justify-between mb-1">
									<label className="text-xs font-semibold text-kumo-subtle">Thế cờ (FEN)</label>
									{!validateFen(currentStep.fen) && (
										<span className="text-xs text-kumo-danger">FEN không hợp lệ</span>
									)}
								</div>
								<div className="mb-2">
									<PositionEditor
										initialFen={currentStep.fen}
										onChange={(newFen: string) => handleStepFieldChange("fen", newFen)}
										width={360}
									/>
								</div>
							</div>

							{/* Mũi tên và Ô sáng */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-xs font-semibold text-kumo-subtle mb-1">
										Mũi tên minh họa (vd: e2e4,g1f3)
									</label>
									<input
										type="text"
										value={currentStep.arrows || ""}
										onChange={(e) => handleStepFieldChange("arrows", e.target.value)}
										className="w-full rounded-md border border-kumo-border bg-kumo-surface px-3 py-2 text-sm text-kumo-foreground font-mono"
										placeholder="e2e4,g1f3"
									/>
								</div>
								<div>
									<label className="block text-xs font-semibold text-kumo-subtle mb-1">
										Ô sáng nổi bật (vd: e4,d5)
									</label>
									<input
										type="text"
										value={currentStep.highlights || ""}
										onChange={(e) => handleStepFieldChange("highlights", e.target.value)}
										className="w-full rounded-md border border-kumo-border bg-kumo-surface px-3 py-2 text-sm text-kumo-foreground font-mono"
										placeholder="e4,d5"
									/>
								</div>
							</div>

							{/* Lời giảng giải cho học viên */}
							<div>
								<label className="block text-xs font-semibold text-kumo-subtle mb-1">
									Lời giảng giải cho Học viên (Hiển thị công khai trên slide)
								</label>
								<InputArea
									value={currentStep.narration || ""}
									onChange={(e) => handleStepFieldChange("narration", e.target.value)}
									rows={3}
									placeholder="Nhập nội dung giảng giải cho học viên ở bước này..."
								/>
							</div>

							{/* Ghi chú riêng cho Huấn Luyện Viên */}
							<div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
								<div className="flex items-center gap-2 mb-1">
									<Badge variant="warning">HLV / Giáo Viên</Badge>
									<label className="text-xs font-semibold text-kumo-foreground">
										Ghi chú sư phạm (Chỉ hiển thị cho Giáo viên & HLV)
									</label>
								</div>
								<p className="text-xs text-kumo-subtle mb-2">
									Nội dung này được bảo mật phía server, hoàn toàn không gửi về trình duyệt của học
									sinh hoặc khách vãng lai.
								</p>
								<InputArea
									value={currentStep.teacherNotes || ""}
									onChange={(e) => handleStepFieldChange("teacherNotes", e.target.value)}
									rows={2}
									placeholder="Ví dụ: Nhắc nhở học sinh tập trung vào ô trung tâm d5..."
								/>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

// =============================================================================
// Admin Page: LessonsAdminPage (`/lessons`)
// =============================================================================

export function LessonsAdminPage() {
	const [statusMessage, setStatusMessage] = useState<string | null>(null);
	const [statusType, setStatusType] = useState<"success" | "error" | "info">("info");
	const [loading, setLoading] = useState(false);

	const handleRunSetup = async () => {
		setLoading(true);
		setStatusMessage("Đang đồng bộ cấu trúc CSDL cho chess-lessons...");
		setStatusType("info");
		try {
			const res = await apiFetch("/_emdash/api/plugins/chess-lessons/setup/run", {
				method: "POST",
			});
			if (res.ok) {
				setStatusType("success");
				setStatusMessage(
					"Đồng bộ CSDL thành công! Đã tạo collection chess_lectures và bổ sung trường cờ vua.",
				);
			} else {
				const err = await res.json().catch(() => ({}));
				setStatusType("error");
				setStatusMessage(`Cài đặt thất bại: ${err.message || res.statusText}`);
			}
		} catch (e) {
			setStatusType("error");
			setStatusMessage(`Lỗi kết nối: ${(e as Error).message}`);
		} finally {
			setLoading(false);
		}
	};

	const handleSeedCurriculum = async () => {
		setLoading(true);
		setStatusMessage("Đang tạo 6 khóa học nháp theo lộ trình 6 cấp độ...");
		setStatusType("info");
		try {
			const res = await apiFetch("/_emdash/api/plugins/chess-lessons/lessons/seed-curriculum", {
				method: "POST",
			});
			if (res.ok) {
				const data = (await res.json()) as CurriculumSeedResult;
				setStatusType("success");
				setStatusMessage(
					`Đã nạp lộ trình 6 cấp độ! Đã tạo: ${data.createdCourses.length} khóa mới, Bỏ qua: ${data.skippedCourses.length} khóa đã có sẵn.`,
				);
			} else {
				const err = await res.json().catch(() => ({}));
				setStatusType("error");
				setStatusMessage(`Lỗi tạo lộ trình: ${err.message || res.statusText}`);
			}
		} catch (e) {
			setStatusType("error");
			setStatusMessage(`Lỗi: ${(e as Error).message}`);
		} finally {
			setLoading(false);
		}
	};

	const handleSeedSampleLesson = async () => {
		setLoading(true);
		setStatusMessage("Đang tạo bài học mẫu 5 bước chuẩn sư phạm...");
		setStatusType("info");
		try {
			const res = await apiFetch("/_emdash/api/plugins/chess-lessons/lessons/seed-sample-lesson", {
				method: "POST",
			});
			if (res.ok) {
				const data = (await res.json()) as SampleLessonSeedResult;
				setStatusType("success");
				setStatusMessage(`Đã tạo bài học mẫu thành công: "${data.title}" (slug: ${data.slug}).`);
			} else {
				const err = await res.json().catch(() => ({}));
				setStatusType("error");
				setStatusMessage(`Lỗi tạo bài học mẫu: ${err.message || res.statusText}`);
			}
		} catch (e) {
			setStatusType("error");
			setStatusMessage(`Lỗi: ${(e as Error).message}`);
		} finally {
			setLoading(false);
		}
	};

	const handleSeedDemoData = async () => {
		setLoading(true);
		setStatusMessage("Đang nạp trọn bộ dữ liệu demo cờ vua...");
		setStatusType("info");
		try {
			const res = await apiFetch("/_emdash/api/plugins/chess-lessons/lessons/seed-demo-data", {
				method: "POST",
			});
			if (res.ok) {
				const data = (await res.json()) as DemoDataSeedResult;
				setStatusType("success");
				setStatusMessage(
					`Nạp dữ liệu demo thành công! Đã tạo 1 khóa học demo và ${data.createdLessons.length} bài học tương tác.`,
				);
			} else {
				const err = await res.json().catch(() => ({}));
				setStatusType("error");
				setStatusMessage(`Lỗi nạp dữ liệu demo: ${err.message || res.statusText}`);
			}
		} catch (e) {
			setStatusType("error");
			setStatusMessage(`Lỗi: ${(e as Error).message}`);
		} finally {
			setLoading(false);
		}
	};

	const handleRefreshSnapshots = async () => {
		setLoading(true);
		setStatusMessage("Đang làm mới snapshot bài giảng trong các bài viết...");
		setStatusType("info");
		try {
			const res = await apiFetch("/_emdash/api/plugins/chess-lessons/snapshots/refresh", {
				method: "POST",
			});
			if (res.ok) {
				const data = await res.json();
				setStatusType("success");
				setStatusMessage(
					`Làm mới snapshot thành công! Đã cập nhật ${data.updatedCount || 0} bài học.`,
				);
			} else {
				const err = await res.json().catch(() => ({}));
				setStatusType("error");
				setStatusMessage(`Lỗi làm mới snapshot: ${err.message || res.statusText}`);
			}
		} catch (e) {
			setStatusType("error");
			setStatusMessage(`Lỗi: ${(e as Error).message}`);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="p-6 max-w-5xl mx-auto space-y-6">
			{/* Tiêu đề trang */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-kumo-foreground">Quản Lý Bài Học Cờ Vua</h1>
					<p className="text-sm text-kumo-subtle mt-1">
						Khung chương trình 6 cấp độ Dương Sinh Chess, bài giảng trình chiếu tương tác và công cụ
						sư phạm.
					</p>
				</div>
				<Button variant="secondary" onClick={handleRunSetup} disabled={loading}>
					Cài đặt CSDL (Setup)
				</Button>
			</div>

			{/* Thông báo trạng thái */}
			{statusMessage && (
				<div
					className={`p-4 rounded-lg border text-sm flex items-center justify-between ${
						statusType === "success"
							? "bg-kumo-success/10 border-kumo-success text-kumo-success"
							: statusType === "error"
								? "bg-kumo-danger/10 border-kumo-danger text-kumo-danger"
								: "bg-kumo-brand/10 border-kumo-brand text-kumo-brand"
					}`}
				>
					<span>{statusMessage}</span>
					<button
						type="button"
						onClick={() => setStatusMessage(null)}
						className="text-xs underline ms-4"
					>
						Đóng
					</button>
				</div>
			)}

			{/* Thẻ 6 cấp độ cờ vua Dương Sinh */}
			<div className="rounded-lg border border-kumo-border bg-kumo-surface p-6 space-y-4">
				<h2 className="text-lg font-bold text-kumo-foreground">
					Khung Lộ Trình 6 Cấp Độ Chuẩn Dương Sinh
				</h2>
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
					{LEVEL_LIST.map((lvl) => (
						<div
							key={lvl.id}
							className="p-3 rounded-lg border border-kumo-border bg-kumo-surface text-center space-y-1"
						>
							<Badge variant="primary">{lvl.nameVi}</Badge>
							<div className="text-xs font-semibold text-kumo-foreground mt-1">{lvl.nameEn}</div>
							<div className="text-xs text-kumo-subtle">
								{lvl.ratingRange[0]} - {lvl.ratingRange[1]} Elo
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Bộ công cụ sư phạm */}
			<div className="rounded-lg border border-kumo-border bg-kumo-surface p-6 space-y-4">
				<h2 className="text-lg font-bold text-kumo-foreground">Công Cụ Sư Phạm Cờ Vua</h2>
				<p className="text-sm text-kumo-subtle">
					Tự động khởi tạo dữ liệu bài học, khung chương trình và làm mới bộ nhớ đệm snapshot.
				</p>
				<div className="flex flex-wrap gap-3">
					<Button variant="secondary" onClick={handleSeedCurriculum} disabled={loading}>
						Khung lộ trình 6 cấp
					</Button>
					<Button variant="secondary" onClick={handleSeedSampleLesson} disabled={loading}>
						Tạo bài học mẫu (5 bước)
					</Button>
					<Button variant="secondary" onClick={handleSeedDemoData} disabled={loading}>
						Nạp dữ liệu mẫu hoàn chỉnh
					</Button>
					<Button variant="secondary" onClick={handleRefreshSnapshots} disabled={loading}>
						Làm mới Snapshot bài giảng
					</Button>
				</div>
			</div>
		</div>
	);
}

// =============================================================================
// Admin Page: ObsidianImportPage (`/import-obsidian`)
// =============================================================================

export function ObsidianImportPage() {
	const [markdown, setMarkdown] = useState("");
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<ObsidianImportResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (event) => {
			const text = event.target?.result as string;
			setMarkdown(text);
		};
		reader.readAsText(file);
	};

	const handleImport = async () => {
		if (!markdown.trim()) {
			setError("Vui lòng nhập hoặc tải file Markdown trước khi thực hiện.");
			return;
		}

		setLoading(true);
		setError(null);
		setResult(null);

		try {
			const res = await apiFetch("/_emdash/api/plugins/chess-lessons/lessons/import-obsidian", {
				method: "POST",
				body: JSON.stringify({ markdown }),
			});

			if (res.ok) {
				const data = (await res.json()) as ObsidianImportResult;
				setResult(data);
			} else {
				const err = await res.json().catch(() => ({}));
				setError(`Nhập bài học thất bại: ${err.message || res.statusText}`);
			}
		} catch (e) {
			setError(`Lỗi kết nối: ${(e as Error).message}`);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="p-6 max-w-4xl mx-auto space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-kumo-foreground">
					Nhập Bài Học Từ Obsidian Markdown
				</h1>
				<p className="text-sm text-kumo-subtle mt-1">
					Chuyển đổi bài giảng và bài tập từ Obsidian vault sang bài học LMS có cấu trúc và khối cờ
					vua tương tác.
				</p>
			</div>

			{error && (
				<div className="p-4 rounded-lg border border-kumo-danger bg-kumo-danger/10 text-sm text-kumo-danger">
					{error}
				</div>
			)}

			<div className="rounded-lg border border-kumo-border bg-kumo-surface p-6 space-y-4">
				<div className="flex items-center justify-between">
					<label className="text-sm font-semibold text-kumo-foreground">
						Nội dung Markdown (có Frontmatter YAML)
					</label>
					<input
						type="file"
						accept=".md,.txt"
						onChange={handleFileUpload}
						className="text-xs text-kumo-subtle file:me-2 file:py-1 file:px-2.5 file:rounded file:border file:border-kumo-border file:text-xs file:bg-kumo-surface file:text-kumo-foreground hover:file:bg-kumo-subtle/10"
					/>
				</div>

				<InputArea
					value={markdown}
					onChange={(e) => setMarkdown(e.target.value)}
					rows={14}
					placeholder={`---\ntitle: "Đòn Tấn Công Đôi của Mã"\ncourse: "ma-so-cap"\nmodule: "Chiến thuật cơ bản"\norder: 1\nlevel: "ma"\nthemes: "fork, knight"\nobjectives: "Hiểu và nhận biết đòn tấn công đôi"\n---\n\n## 1. Khởi động\n\nNội dung bài học...\n\n\`\`\`fen\nr1bqk2r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5\n\`\`\``}
				/>

				<Button variant="primary" onClick={handleImport} disabled={loading || !markdown.trim()}>
					{loading ? "Đang xử lý nhập bài học..." : "Nhập Bài Học Vào LMS"}
				</Button>
			</div>

			{/* Kết quả nhập */}
			{result && (
				<div className="rounded-lg border border-kumo-border bg-kumo-surface p-6 space-y-3">
					<div className="flex items-center gap-2">
						<Badge variant="success">Thành Công</Badge>
						<h3 className="text-lg font-bold text-kumo-foreground">
							Đã tạo bài học: "{result.title}"
						</h3>
					</div>
					<div className="text-sm space-y-1 text-kumo-foreground">
						<p>
							Trạng thái: <strong>Bản nháp (Draft)</strong>
						</p>
						<p>
							Số khối Portable Text tạo thành: <strong>{result.blocksCount}</strong>
						</p>
					</div>

					{result.warnings.length > 0 && (
						<div className="mt-3 rounded border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700">
							<h4 className="font-semibold mb-1">Cảnh báo:</h4>
							<ul className="list-disc list-inside space-y-0.5">
								{result.warnings.map((w, idx) => (
									<li key={idx}>{w}</li>
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
	"lecture-builder": LectureBuilderWidget,
	"chess-lessons:lecture-builder": LectureBuilderWidget,
};

export const pages = {
	"/lessons": LessonsAdminPage,
	"/import-obsidian": ObsidianImportPage,
};
