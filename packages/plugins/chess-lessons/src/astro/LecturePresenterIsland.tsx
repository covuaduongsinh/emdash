import { LEVEL_LIST } from "@duongsinh/chess-kit/core";
import { Board, type BoardOrientation } from "@duongsinh/chess-kit/react";
import React, { useCallback, useEffect, useState } from "react";

import type { LectureStep } from "../types.js";

function formatTimer(totalSecs: number): string {
	const mins = Math.floor(totalSecs / 60);
	const secs = totalSecs % 60;
	return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export interface LecturePresenterIslandProps {
	lectureId?: string;
	title: string;
	level?: string;
	steps: LectureStep[];
	isTeacher?: boolean;
}

export function LecturePresenterIsland({
	title,
	level,
	steps = [],
	isTeacher = false,
}: LecturePresenterIslandProps) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isBlackout, setIsBlackout] = useState(false);
	const [elapsedSeconds, setElapsedSeconds] = useState(0);
	const [isTimerRunning, setIsTimerRunning] = useState(true);

	const currentStep = steps[currentIndex] ||
		steps[0] || {
			fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
			narration: "Bài giảng chưa có nội dung.",
			orientation: "white" as BoardOrientation,
		};

	// Đồng hồ đếm thời gian buổi học
	useEffect(() => {
		if (!isTimerRunning) return;
		const interval = setInterval(() => {
			setElapsedSeconds((s) => s + 1);
		}, 1000);
		return () => clearInterval(interval);
	}, [isTimerRunning]);

	const handleNext = useCallback(() => {
		setCurrentIndex((idx) => Math.min(steps.length - 1, idx + 1));
	}, [steps.length]);

	const handlePrev = useCallback(() => {
		setCurrentIndex((idx) => Math.max(0, idx - 1));
	}, []);

	// Lắng nghe phím tắt điều khiển trình chiếu
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
				return;
			}

			if (e.key === "PageDown" || e.key === "ArrowRight" || e.key === " ") {
				e.preventDefault();
				handleNext();
			} else if (e.key === "PageUp" || e.key === "ArrowLeft" || e.key === "Backspace") {
				e.preventDefault();
				handlePrev();
			} else if (e.key.toLowerCase() === "b") {
				e.preventDefault();
				setIsBlackout((b) => !b);
			} else if (e.key === "Home") {
				e.preventDefault();
				setCurrentIndex(0);
			} else if (e.key === "End") {
				e.preventDefault();
				setCurrentIndex(steps.length - 1);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handleNext, handlePrev, steps.length]);

	const levelObj = LEVEL_LIST.find((l) => l.id === level);

	if (isBlackout) {
		return (
			<div
				onClick={() => setIsBlackout(false)}
				style={{
					position: "fixed",
					inset: 0,
					backgroundColor: "#000000",
					zIndex: 99999,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					cursor: "pointer",
					color: "#333333",
					userSelect: "none",
				}}
			>
				<span style={{ fontSize: "0.875rem" }}>
					[Màn hình tắt tạm thời - Nhấn phím 'B' hoặc nhấp chuột để tiếp tục]
				</span>
			</div>
		);
	}

	return (
		<div
			style={{
				minHeight: "100vh",
				backgroundColor: "#0f172a",
				color: "#f8fafc",
				display: "flex",
				flexDirection: "column",
				fontFamily: "system-ui, -apple-system, sans-serif",
			}}
		>
			{/* Top Bar / Thanh điều khiển trên */}
			<header
				style={{
					padding: "0.75rem 1.5rem",
					backgroundColor: "#1e293b",
					borderBottom: "1px solid #334155",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
					<a
						href={`/bai-giang`}
						style={{
							color: "#94a3b8",
							textDecoration: "none",
							fontSize: "0.875rem",
							display: "flex",
							alignItems: "center",
							gap: "0.25rem",
						}}
					>
						← Thoát Trình Chiếu
					</a>
					<h1 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: "#ffffff" }}>
						{title}
					</h1>
					{levelObj && (
						<span
							style={{
								fontSize: "0.75rem",
								padding: "0.125rem 0.5rem",
								borderRadius: "0.25rem",
								backgroundColor: "#2B3990",
								color: "#ffffff",
								fontWeight: 600,
							}}
						>
							Cấp {levelObj.nameVi}
						</span>
					)}
				</div>

				<div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
					{/* Đồng hồ buổi học */}
					<div
						onClick={() => setIsTimerRunning((r) => !r)}
						style={{
							display: "flex",
							alignItems: "center",
							gap: "0.375rem",
							fontSize: "0.875rem",
							fontFamily: "monospace",
							color: "#cbd5e1",
							cursor: "pointer",
							padding: "0.25rem 0.5rem",
							borderRadius: "0.25rem",
							backgroundColor: "#0f172a",
						}}
						title="Nhấp để tạm dừng / tiếp tục đồng hồ"
					>
						<span>⏱ {formatTimer(elapsedSeconds)}</span>
					</div>

					{/* Phím tắt hỗ trợ */}
					<button
						type="button"
						onClick={() => setIsBlackout(true)}
						style={{
							fontSize: "0.75rem",
							padding: "0.25rem 0.625rem",
							borderRadius: "0.25rem",
							backgroundColor: "#334155",
							color: "#f8fafc",
							border: "none",
							cursor: "pointer",
						}}
						title="Tắt màn hình đen tạm thời (Phím B)"
					>
						Tắt Màn Hình (B)
					</button>

					{/* Chỉ số bước */}
					<span
						style={{
							fontSize: "0.875rem",
							fontWeight: 600,
							color: "#38bdf8",
							backgroundColor: "#0369a1",
							padding: "0.25rem 0.75rem",
							borderRadius: "1rem",
						}}
					>
						Bước {currentIndex + 1} / {steps.length}
					</span>
				</div>
			</header>

			{/* Khung chính trình chiếu */}
			<main
				style={{
					flex: 1,
					display: "grid",
					gridTemplateColumns: "1fr 420px",
					gap: "2rem",
					padding: "1.5rem",
					maxWidth: "1600px",
					margin: "0 auto",
					width: "100%",
					boxSizing: "border-box",
				}}
			>
				{/* Bàn cờ trung tâm */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<div style={{ maxWidth: "600px", width: "100%", aspectRatio: "1/1" }}>
						<Board
							fen={currentStep.fen}
							orientation={currentStep.orientation || "white"}
							arrows={currentStep.arrows}
							highlights={currentStep.highlights}
						/>
					</div>
				</div>

				{/* Cột thông tin bài giảng */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "1.25rem",
						justifyContent: "space-between",
					}}
				>
					<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
						{/* Tiêu đề bước */}
						<div
							style={{
								padding: "1rem",
								borderRadius: "0.5rem",
								backgroundColor: "#1e293b",
								border: "1px solid #334155",
							}}
						>
							<h2 style={{ margin: 0, fontSize: "1.25rem", color: "#38bdf8" }}>
								{currentStep.title || `Bước ${currentIndex + 1}`}
							</h2>
						</div>

						{/* Lời giảng giải cho học viên */}
						<div
							style={{
								padding: "1.25rem",
								borderRadius: "0.5rem",
								backgroundColor: "#1e293b",
								border: "1px solid #334155",
								fontSize: "1.125rem",
								lineHeight: 1.6,
								color: "#f1f5f9",
							}}
						>
							<div
								style={{
									fontWeight: 600,
									color: "#94a3b8",
									fontSize: "0.875rem",
									marginBottom: "0.5rem",
								}}
							>
								LỜI GIẢNG BÀI:
							</div>
							{currentStep.narration || "Quan sát thế cờ trên bàn cờ."}
						</div>

						{/* Ghi chú riêng cho Huấn Luyện Viên (Chỉ render khi isTeacher = true) */}
						{isTeacher && currentStep.teacherNotes && (
							<div
								style={{
									padding: "1rem",
									borderRadius: "0.5rem",
									backgroundColor: "#451a03",
									border: "1px solid #b45309",
									color: "#fef3c7",
									fontSize: "0.875rem",
								}}
							>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.5rem",
										fontWeight: 700,
										color: "#f59e0b",
										marginBottom: "0.25rem",
									}}
								>
									<span>📋 GHI CHÚ HUẤN LUYỆN VIÊN (BẢO MẬT):</span>
								</div>
								<div style={{ lineHeight: 1.5 }}>{currentStep.teacherNotes}</div>
							</div>
						)}
					</div>

					{/* Thanh nút điều hướng */}
					<div
						style={{
							display: "flex",
							gap: "1rem",
							paddingTop: "1rem",
							borderTop: "1px solid #334155",
						}}
					>
						<button
							type="button"
							onClick={handlePrev}
							disabled={currentIndex === 0}
							style={{
								flex: 1,
								padding: "0.875rem",
								borderRadius: "0.5rem",
								backgroundColor: currentIndex === 0 ? "#334155" : "#475569",
								color: "#ffffff",
								border: "none",
								fontWeight: 600,
								fontSize: "1rem",
								cursor: currentIndex === 0 ? "not-allowed" : "pointer",
								opacity: currentIndex === 0 ? 0.5 : 1,
							}}
						>
							← Bước Trước (←)
						</button>
						<button
							type="button"
							onClick={handleNext}
							disabled={currentIndex === steps.length - 1}
							style={{
								flex: 1,
								padding: "0.875rem",
								borderRadius: "0.5rem",
								backgroundColor: currentIndex === steps.length - 1 ? "#334155" : "#2B3990",
								color: "#ffffff",
								border: "none",
								fontWeight: 600,
								fontSize: "1rem",
								cursor: currentIndex === steps.length - 1 ? "not-allowed" : "pointer",
								opacity: currentIndex === steps.length - 1 ? 0.5 : 1,
							}}
						>
							Bước Kế Tiếp (→) →
						</button>
					</div>
				</div>
			</main>
		</div>
	);
}

export default LecturePresenterIsland;
