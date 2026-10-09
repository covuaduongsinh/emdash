/**
 * QuizRunner Interactive Component
 * Student-facing runner for quizzes with support for chess puzzles.
 * Handles timer, answer collection, submission, and requirement protocol.
 */

import { MoveRecorder } from "@duongsinh/chess-kit/react";
import React, { useEffect, useState } from "react";

export interface QuizRunnerProps {
	quizId: string;
	lessonId?: string;
	courseId?: string;
	apiBaseUrl?: string;
}

interface StrippedQuestion {
	id: string;
	question: string;
	question_image?: string;
	type: "single" | "multiple" | "text" | "fill_blank" | "chess";
	answers?: unknown;
	grade: number;
	sort_order: number;
}

interface QuizPresentData {
	id: string;
	title: string;
	description?: string;
	passmark: number;
	pass_required: boolean;
	timer_minutes?: number;
	allow_reset: boolean;
	questionCount: number;
	questions: StrippedQuestion[];
}

interface EvaluationResult {
	quizId: string;
	score: number;
	maxScore: number;
	percentage: number;
	passed: boolean;
	timeSpentSeconds: number;
	details: Array<{
		questionId: string;
		isCorrect: boolean;
		score: number;
		maxScore: number;
		explanation?: string;
		reason?: string;
	}>;
}

function formatTime(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function QuizRunner({
	quizId,
	lessonId,
	courseId,
	apiBaseUrl = "/_emdash/api/plugins/lms",
}: QuizRunnerProps) {
	const [quiz, setQuiz] = useState<QuizPresentData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// User answers state
	const [singleAnswers, setSingleAnswers] = useState<Record<string, string>>({});
	const [multiAnswers, setMultiAnswers] = useState<Record<string, string[]>>({});
	const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
	const [chessAnswers, setChessAnswers] = useState<Record<string, string[]>>({});

	// Timer state
	const [startedAt, setStartedAt] = useState<string>("");
	const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

	// Submission state
	const [submitting, setSubmitting] = useState(false);
	const [result, setResult] = useState<EvaluationResult | null>(null);

	// Fetch quiz definition (stripped)
	useEffect(() => {
		async function loadQuiz() {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch(`${apiBaseUrl}/quiz/present`, {
					method: "POST",
					headers: { "Content-Type": "application/json", "X-EmDash-Request": "1" },
					body: JSON.stringify({ quizId }),
				});
				if (!res.ok) {
					throw new Error("Không thể tải bài tập kiểm tra");
				}
				const json = await res.json();
				const data = json.data as QuizPresentData;
				setQuiz(data);

				const now = new Date().toISOString();
				setStartedAt(now);

				if (data.timer_minutes && data.timer_minutes > 0) {
					setRemainingSeconds(data.timer_minutes * 60);
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : "Lỗi khi tải quiz");
			} finally {
				setLoading(false);
			}
		}
		loadQuiz();
	}, [quizId, apiBaseUrl]);

	// Timer countdown effect
	useEffect(() => {
		if (remainingSeconds === null || remainingSeconds <= 0 || result) return;

		const timer = setInterval(() => {
			setRemainingSeconds((prev) => {
				if (prev === null || prev <= 1) {
					clearInterval(timer);
					handleSubmit(); // Auto-submit when time expires
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [remainingSeconds, result]);

	function handleSingleSelect(questionId: string, answerId: string) {
		setSingleAnswers((prev) => ({ ...prev, [questionId]: answerId }));
	}

	function handleMultiToggle(questionId: string, answerId: string) {
		setMultiAnswers((prev) => {
			const current = prev[questionId] || [];
			const next = current.includes(answerId)
				? current.filter((id) => id !== answerId)
				: [...current, answerId];
			return { ...prev, [questionId]: next };
		});
	}

	function handleTextChange(questionId: string, text: string) {
		setTextAnswers((prev) => ({ ...prev, [questionId]: text }));
	}

	function handleChessMove(questionId: string, playedMoves: string[]) {
		setChessAnswers((prev) => ({ ...prev, [questionId]: playedMoves }));
	}

	async function handleSubmit() {
		if (!quiz || submitting || result) return;

		setSubmitting(true);
		try {
			// Build answers payload
			const answersPayload = quiz.questions.map((q) => {
				if (q.type === "single") {
					const sel = singleAnswers[q.id];
					return {
						questionId: q.id,
						selectedAnswerIds: sel ? [sel] : [],
					};
				}
				if (q.type === "multiple") {
					return {
						questionId: q.id,
						selectedAnswerIds: multiAnswers[q.id] || [],
					};
				}
				if (q.type === "text" || q.type === "fill_blank") {
					return {
						questionId: q.id,
						textAnswer: textAnswers[q.id] || "",
					};
				}
				if (q.type === "chess") {
					return {
						questionId: q.id,
						playedUci: chessAnswers[q.id] || [],
					};
				}
				return { questionId: q.id };
			});

			// Try authenticated submit first, fallback to guest submit
			let res = await fetch(`${apiBaseUrl}/me/quiz/submit`, {
				method: "POST",
				headers: { "Content-Type": "application/json", "X-EmDash-Request": "1" },
				body: JSON.stringify({
					quizId,
					lessonId,
					courseId,
					startedAt,
					answers: answersPayload,
				}),
			});

			if (res.status === 401) {
				// Guest submission
				res = await fetch(`${apiBaseUrl}/quiz/submit`, {
					method: "POST",
					headers: { "Content-Type": "application/json", "X-EmDash-Request": "1" },
					body: JSON.stringify({
						quizId,
						lessonId,
						courseId,
						startedAt,
						answers: answersPayload,
					}),
				});
			}

			if (!res.ok) {
				const errJson = await res.json().catch(() => ({}));
				throw new Error(errJson.error?.message || "Nộp bài thất bại");
			}

			const json = await res.json();
			const evalResult = json.data as EvaluationResult;
			setResult(evalResult);

			// Requirement protocol: if passed, dispatch event
			if (evalResult.passed) {
				if (typeof window !== "undefined") {
					window.dispatchEvent(
						new CustomEvent("lms:requirement-done", {
							detail: { requirementId: `quiz:${quizId}` },
						}),
					);
				}
			}
		} catch (err) {
			alert(err instanceof Error ? err.message : "Có lỗi xảy ra khi nộp bài");
		} finally {
			setSubmitting(false);
		}
	}

	function handleRetry() {
		setResult(null);
		setSingleAnswers({});
		setMultiAnswers({});
		setTextAnswers({});
		setChessAnswers({});
		setStartedAt(new Date().toISOString());
		if (quiz?.timer_minutes) {
			setRemainingSeconds(quiz.timer_minutes * 60);
		}
	}

	if (loading) {
		return (
			<div
				className="ds-quiz-runner"
				style={{
					padding: "2rem",
					textAlign: "center",
					background: "#f8fafc",
					borderRadius: "0.5rem",
					border: "1px solid #e2e8f0",
				}}
			>
				<div>Đang tải bài tập kiểm tra...</div>
			</div>
		);
	}

	if (error || !quiz) {
		return (
			<div
				className="ds-quiz-runner"
				style={{
					padding: "1.5rem",
					background: "#fef2f2",
					color: "#dc2626",
					borderRadius: "0.5rem",
					border: "1px solid #fecaca",
				}}
			>
				<div>⚠ {error || "Không tìm thấy bài tập"}</div>
			</div>
		);
	}

	return (
		<div
			className="ds-quiz-runner"
			data-lms-requirement={`quiz:${quizId}`}
			style={{
				background: "#ffffff",
				border: "1px solid #e2e8f0",
				borderRadius: "0.75rem",
				padding: "1.5rem",
				margin: "1.5rem 0",
				boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
			}}
		>
			{/* Header */}
			<div
				style={{
					borderBottom: "1px solid #e2e8f0",
					paddingBottom: "1rem",
					marginBottom: "1.5rem",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					flexWrap: "wrap",
					gap: "0.75rem",
				}}
			>
				<div>
					<h3
						style={{
							margin: 0,
							fontSize: "1.25rem",
							fontWeight: 600,
							color: "var(--ds-navy, #2B3990)",
						}}
					>
						📋 {quiz.title}
					</h3>
					{quiz.description && (
						<p style={{ margin: "0.25rem 0 0 0", color: "#64748b", fontSize: "0.875rem" }}>
							{quiz.description}
						</p>
					)}
				</div>

				<div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
					<span
						style={{
							fontSize: "0.8125rem",
							background: "#f1f5f9",
							padding: "0.25rem 0.5rem",
							borderRadius: "0.25rem",
							color: "#475569",
						}}
					>
						Điểm đạt: {quiz.passmark}%
					</span>
					{remainingSeconds !== null && !result && (
						<span
							style={{
								fontSize: "0.875rem",
								fontWeight: "bold",
								color: remainingSeconds < 60 ? "#ef4444" : "#2563eb",
								fontFamily: "monospace",
								background: remainingSeconds < 60 ? "#fee2e2" : "#eff6ff",
								padding: "0.25rem 0.5rem",
								borderRadius: "0.25rem",
							}}
						>
							⏱ {formatTime(remainingSeconds)}
						</span>
					)}
				</div>
			</div>

			{/* Results View */}
			{result ? (
				<div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
					<div
						style={{
							padding: "1.25rem",
							borderRadius: "0.5rem",
							background: result.passed ? "#f0fdf4" : "#fef2f2",
							border: `1px solid ${result.passed ? "#bbf7d0" : "#fecaca"}`,
							textAlign: "center",
						}}
					>
						<div
							style={{
								fontSize: "1.25rem",
								fontWeight: "bold",
								color: result.passed ? "#16a34a" : "#dc2626",
								marginBottom: "0.25rem",
							}}
						>
							{result.passed ? "🎉 Chúc mừng! Bạn đã đạt bài kiểm tra" : "Chưa đạt yêu cầu"}
						</div>
						<div style={{ fontSize: "1rem", color: "#334155" }}>
							Điểm số: <strong>{result.score}</strong> / {result.maxScore} (
							<strong>{result.percentage}%</strong>) — Điểm đạt: {quiz.passmark}%
						</div>
					</div>

					{/* Question-by-question review */}
					<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
						{quiz.questions.map((q, idx) => {
							const detail = result.details.find((d) => d.questionId === q.id);
							const isCorrect = detail?.isCorrect ?? false;

							return (
								<div
									key={q.id}
									style={{
										padding: "1rem",
										borderRadius: "0.5rem",
										border: `1px solid ${isCorrect ? "#bbf7d0" : "#fecaca"}`,
										background: isCorrect ? "#f0fdf4" : "#fef2f2",
									}}
								>
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											fontWeight: 500,
											marginBottom: "0.5rem",
										}}
									>
										<span>
											Câu {idx + 1}: {q.question}
										</span>
										<span style={{ fontWeight: "bold", color: isCorrect ? "#16a34a" : "#dc2626" }}>
											{isCorrect ? "✓ Đúng" : "✗ Sai"} ({detail?.score || 0}/{q.grade} điểm)
										</span>
									</div>
									{detail?.explanation && (
										<div
											style={{
												marginTop: "0.5rem",
												fontSize: "0.875rem",
												color: "#475569",
												background: "#ffffff",
												padding: "0.5rem 0.75rem",
												borderRadius: "0.375rem",
												border: "1px solid #e2e8f0",
											}}
										>
											<strong>Giải thích:</strong> {detail.explanation}
										</div>
									)}
								</div>
							);
						})}
					</div>

					{quiz.allow_reset && (
						<div style={{ textAlign: "center", marginTop: "0.5rem" }}>
							<button
								type="button"
								onClick={handleRetry}
								style={{
									padding: "0.625rem 1.25rem",
									background: "var(--ds-navy, #2B3990)",
									color: "#ffffff",
									border: "none",
									borderRadius: "0.375rem",
									fontWeight: 500,
									cursor: "pointer",
								}}
							>
								🔄 Làm lại bài tập
							</button>
						</div>
					)}
				</div>
			) : (
				/* Questions List Form */
				<form
					onSubmit={(e) => {
						e.preventDefault();
						handleSubmit();
					}}
					style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
				>
					{quiz.questions.map((q, idx) => (
						<div
							key={q.id}
							style={{
								padding: "1rem",
								borderRadius: "0.5rem",
								background: "#f8fafc",
								border: "1px solid #e2e8f0",
							}}
						>
							<div
								style={{
									fontSize: "0.9375rem",
									fontWeight: 600,
									color: "#1e293b",
									marginBottom: "0.75rem",
								}}
							>
								Câu {idx + 1}: {q.question} ({q.grade} điểm)
							</div>

							{/* Single Choice */}
							{q.type === "single" && Array.isArray(q.answers) && (
								<div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
									{q.answers.map((opt: any) => (
										<label
											key={opt.id}
											style={{
												display: "flex",
												alignItems: "center",
												gap: "0.5rem",
												padding: "0.5rem 0.75rem",
												background: "#ffffff",
												border: "1px solid #cbd5e1",
												borderRadius: "0.375rem",
												cursor: "pointer",
											}}
										>
											<input
												type="radio"
												name={`question-${q.id}`}
												value={opt.id}
												checked={singleAnswers[q.id] === opt.id}
												onChange={() => handleSingleSelect(q.id, opt.id)}
											/>
											<span style={{ fontSize: "0.875rem" }}>{opt.text}</span>
										</label>
									))}
								</div>
							)}

							{/* Multiple Choice */}
							{q.type === "multiple" && Array.isArray(q.answers) ? (
								<div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
									{q.answers.map((opt: any) => {
										const checked = (multiAnswers[q.id] || []).includes(opt.id);
										return (
											<label
												key={opt.id}
												style={{
													display: "flex",
													alignItems: "center",
													gap: "0.5rem",
													padding: "0.5rem 0.75rem",
													background: "#ffffff",
													border: "1px solid #cbd5e1",
													borderRadius: "0.375rem",
													cursor: "pointer",
												}}
											>
												<input
													type="checkbox"
													value={opt.id}
													checked={checked}
													onChange={() => handleMultiToggle(q.id, opt.id)}
												/>
												<span style={{ fontSize: "0.875rem" }}>{opt.text}</span>
											</label>
										);
									})}
								</div>
							) : null}

							{/* Text / Fill Blank */}
							{(q.type === "text" || q.type === "fill_blank") && (
								<div>
									<input
										type="text"
										placeholder="Nhập câu trả lời của bạn..."
										value={textAnswers[q.id] || ""}
										onChange={(e) => handleTextChange(q.id, e.target.value)}
										style={{
											width: "100%",
											padding: "0.5rem 0.75rem",
											borderRadius: "0.375rem",
											border: "1px solid #cbd5e1",
											fontSize: "0.875rem",
										}}
									/>
								</div>
							)}

							{/* Chess Puzzle */}
							{q.type === "chess" && q.answers ? (
								<div>
									{Boolean((q.answers as any).prompt) && (
										<div
											style={{
												marginBottom: "0.5rem",
												fontSize: "0.875rem",
												color: "#475569",
												fontStyle: "italic",
											}}
										>
											👉 {String((q.answers as any).prompt)}
										</div>
									)}
									<div style={{ maxWidth: 440, margin: "0 auto" }}>
										<MoveRecorder
											fen={(q.answers as any).fen}
											orientation={(q.answers as any).orientation || "white"}
											initialMoves={chessAnswers[q.id] || []}
											onChange={(moves) => handleChessMove(q.id, moves)}
											width={420}
										/>
									</div>
								</div>
							) : null}
						</div>
					))}

					<div style={{ textAlign: "end", paddingTop: "0.5rem" }}>
						<button
							type="submit"
							disabled={submitting}
							style={{
								padding: "0.625rem 1.5rem",
								background: "var(--ds-navy, #2B3990)",
								color: "#ffffff",
								border: "none",
								borderRadius: "0.375rem",
								fontWeight: 600,
								cursor: submitting ? "not-allowed" : "pointer",
								opacity: submitting ? 0.7 : 1,
							}}
						>
							{submitting ? "Đang chấm bài..." : "Nộp bài kiểm tra"}
						</button>
					</div>
				</form>
			)}
		</div>
	);
}
