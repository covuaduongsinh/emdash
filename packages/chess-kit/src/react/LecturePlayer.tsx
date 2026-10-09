import React, { useState } from "react";

import { t } from "../i18n/index.js";
import { markLectureCompleted } from "../progress/index.js";
import { Board, type BoardOrientation } from "./Board.js";

export interface LectureStep {
	id?: string;
	title?: string;
	fen: string;
	arrows?: string;
	highlights?: string;
	narration: string;
	teacherNotes?: string;
	orientation?: BoardOrientation;
}

export interface LecturePlayerProps {
	lectureId?: string;
	title?: string;
	steps: LectureStep[];
	showTeacherNotes?: boolean;
	onCompleted?: (lectureId?: string) => void;
	width?: number;
	className?: string;
}

export function LecturePlayer({
	lectureId,
	title,
	steps = [],
	showTeacherNotes = false,
	onCompleted,
	width = 720,
	className = "",
}: LecturePlayerProps) {
	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [isCompleted, setIsCompleted] = useState(false);

	if (steps.length === 0) {
		return <div className="ds-chess-container">Bài giảng chưa có nội dung bước nào.</div>;
	}

	const currentStep = steps[currentStepIndex] || steps[0];
	const isFirst = currentStepIndex === 0;
	const isLast = currentStepIndex === steps.length - 1;

	const handleNext = () => {
		if (isLast) {
			setIsCompleted(true);
			if (lectureId) {
				markLectureCompleted(lectureId);
			}
			onCompleted?.(lectureId);
		} else {
			setCurrentStepIndex((c) => c + 1);
		}
	};

	const handlePrev = () => {
		setCurrentStepIndex((c) => Math.max(0, c - 1));
	};

	return (
		<div
			className={`ds-chess-container ${className}`}
			style={{
				maxWidth: width,
				margin: "1rem auto",
				display: "flex",
				flexDirection: "column",
				gap: "1rem",
			}}
		>
			{/* Lecture title & step progress */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					paddingBottom: "0.5rem",
					borderBottom: "1px solid #e2e8f0",
				}}
			>
				<h3 style={{ margin: 0, fontSize: "1.125rem", color: "var(--ds-navy)" }}>
					{title || "Bài giảng cờ vua"}
				</h3>
				<span
					style={{
						fontSize: "0.875rem",
						fontWeight: 600,
						padding: "0.25rem 0.625rem",
						backgroundColor: "#f1f5f9",
						borderRadius: "1rem",
						color: "#475569",
					}}
				>
					{t("step")} {currentStepIndex + 1} / {steps.length}
				</span>
			</div>

			<div
				style={{
					display: "flex",
					flexWrap: "wrap",
					gap: "1.25rem",
					justifyContent: "center",
				}}
			>
				{/* Chessboard */}
				<div style={{ flex: "1 1 320px", maxWidth: 440 }}>
					<Board
						fen={currentStep?.fen}
						arrows={currentStep?.arrows}
						highlights={currentStep?.highlights}
						orientation={currentStep?.orientation || "white"}
						size={440}
					/>
				</div>

				{/* Narration & Teacher Notes panel */}
				<div
					style={{
						flex: "1 1 240px",
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
						gap: "1rem",
					}}
				>
					<div
						style={{
							backgroundColor: "#ffffff",
							border: "1px solid #e2e8f0",
							borderRadius: "0.5rem",
							padding: "1rem",
						}}
					>
						{currentStep?.title && (
							<h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", color: "#1e293b" }}>
								{currentStep.title}
							</h4>
						)}
						<p
							style={{
								margin: 0,
								fontSize: "0.9375rem",
								lineHeight: 1.6,
								color: "#334155",
								whiteSpace: "pre-wrap",
							}}
						>
							{currentStep?.narration}
						</p>

						{/* Teacher Notes (for coaches only) */}
						{showTeacherNotes && currentStep?.teacherNotes && (
							<div
								style={{
									marginTop: "1rem",
									padding: "0.75rem",
									backgroundColor: "#fef3c7",
									borderLeft: "4px solid var(--ds-gold)",
									borderRadius: "0.25rem",
									fontSize: "0.8125rem",
									color: "#92400e",
								}}
							>
								<strong>📋 {t("teacherNotes")}:</strong>
								<div style={{ marginTop: "0.25rem" }}>{currentStep.teacherNotes}</div>
							</div>
						)}
					</div>

					{/* Navigation step buttons */}
					<div style={{ display: "flex", gap: "0.5rem", justifyContent: "space-between" }}>
						<button type="button" className="ds-button" onClick={handlePrev} disabled={isFirst}>
							◀ {t("prevStep")}
						</button>
						<button
							type="button"
							className={`ds-button ${isLast ? "ds-button-gold" : "ds-button-primary"}`}
							onClick={handleNext}
						>
							{isLast ? `✓ ${t("finishLecture")}` : `${t("nextStep")} ▶`}
						</button>
					</div>
				</div>
			</div>

			{isCompleted && (
				<div
					style={{
						padding: "0.75rem",
						backgroundColor: "#dcfce7",
						color: "#166534",
						borderRadius: "0.375rem",
						textAlign: "center",
						fontWeight: 500,
						border: "1px solid #bbf7d0",
					}}
				>
					🎉 Bạn đã hoàn thành toàn bộ bài giảng này!
				</div>
			)}
		</div>
	);
}
