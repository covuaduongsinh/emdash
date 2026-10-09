import { Chess } from "chess.js";
import React, { useState, useEffect, useCallback, useRef } from "react";

import { checkPuzzleMove } from "../core/puzzle.js";
import { t } from "../i18n/index.js";
import { markPuzzleSolved } from "../progress/index.js";
import { Board, type BoardOrientation } from "./Board.js";

export interface PuzzlePlayerProps {
	puzzleId?: string;
	fen: string;
	solution: string[]; // Danh sách nước đi UCI
	prompt?: string;
	hint?: string;
	explanation?: string;
	orientation?: BoardOrientation;
	onSolved?: (puzzleId?: string) => void;
	onFailed?: () => void;
	width?: number;
	className?: string;
}

export function PuzzlePlayer({
	puzzleId,
	fen,
	solution,
	prompt,
	hint,
	explanation,
	orientation = "auto",
	onSolved,
	onFailed,
	width = 460,
	className = "",
}: PuzzlePlayerProps) {
	const [currentFen, setCurrentFen] = useState(fen);
	const [plyIndex, setPlyIndex] = useState(0);
	const [isSolved, setIsSolved] = useState(false);
	const [statusMessage, setStatusMessage] = useState<string | null>(null);
	const [showHint, setShowHint] = useState(false);
	const [showSolution, setShowSolution] = useState(false);
	const [isOpponentThinking, setIsOpponentThinking] = useState(false);

	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Reset state when puzzle changes
	useEffect(() => {
		setCurrentFen(fen);
		setPlyIndex(0);
		setIsSolved(false);
		setStatusMessage(null);
		setShowHint(false);
		setShowSolution(false);
		setIsOpponentThinking(false);

		if (timerRef.current) clearTimeout(timerRef.current);
	}, [fen, solution]);

	const handlePieceDrop = useCallback(
		(sourceSquare: string, targetSquare: string, _piece: string): boolean => {
			if (isSolved || isOpponentThinking) return false;

			const moveUci = `${sourceSquare}${targetSquare}`;
			// Try queen promo if pawn reaches 8th or 1st rank
			const game = new Chess(currentFen);
			let fullMoveUci = moveUci;

			// Check if promotion is needed
			const pieceOnSource = game.get(sourceSquare as any);
			if (
				pieceOnSource?.type === "p" &&
				((pieceOnSource.color === "w" && targetSquare[1] === "8") ||
					(pieceOnSource.color === "b" && targetSquare[1] === "1"))
			) {
				fullMoveUci = `${moveUci}q`;
			}

			const check = checkPuzzleMove(currentFen, solution, plyIndex, fullMoveUci);

			if (!check.correct) {
				setStatusMessage(t("puzzleFailed"));
				onFailed?.();
				return false;
			}

			// Apply player's move to board
			const promotion = fullMoveUci.length > 4 ? fullMoveUci.slice(4, 5).toLowerCase() : undefined;
			game.move({ from: sourceSquare, to: targetSquare, promotion });
			const afterPlayerFen = game.fen();
			setCurrentFen(afterPlayerFen);

			if (check.done) {
				setIsSolved(true);
				setStatusMessage(t("puzzleSolved"));
				if (puzzleId) {
					markPuzzleSolved(puzzleId);
				}
				onSolved?.(puzzleId);

				// Dispatch window custom event for cross-plugin communication
				if (typeof window !== "undefined") {
					window.dispatchEvent(
						new CustomEvent("duongsinh-chess:puzzle-solved", {
							detail: { puzzleId, fen, solution },
						}),
					);
				}
				return true;
			}

			// If puzzle continues with opponent reply
			if (check.opponentReply) {
				setIsOpponentThinking(true);
				setStatusMessage("Nước đi đúng! Đối thủ đang đáp trả...");

				timerRef.current = setTimeout(() => {
					const oppMove = check.opponentReply!;
					const oppGame = new Chess(afterPlayerFen);
					const oppFrom = oppMove.slice(0, 2);
					const oppTo = oppMove.slice(2, 4);
					const oppPromo = oppMove.length > 4 ? oppMove.slice(4, 5).toLowerCase() : undefined;

					oppGame.move({ from: oppFrom, to: oppTo, promotion: oppPromo });
					setCurrentFen(oppGame.fen());
					setPlyIndex((p) => p + 2);
					setIsOpponentThinking(false);
					setStatusMessage("Lượt của bạn. Hãy tìm nước đi tiếp theo!");
				}, 400);
			}

			return true;
		},
		[
			currentFen,
			solution,
			plyIndex,
			isSolved,
			isOpponentThinking,
			puzzleId,
			fen,
			onSolved,
			onFailed,
		],
	);

	const handleReset = () => {
		setCurrentFen(fen);
		setPlyIndex(0);
		setIsSolved(false);
		setStatusMessage(null);
		setShowHint(false);
		setIsOpponentThinking(false);
		if (timerRef.current) clearTimeout(timerRef.current);
	};

	const nextExpectedMove = solution[plyIndex];
	const hintText =
		hint ||
		(nextExpectedMove
			? `Gợi ý: Quân ở ô ${nextExpectedMove.slice(0, 2).toUpperCase()}`
			: undefined);

	return (
		<div
			className={`ds-chess-container ${className}`}
			style={{
				maxWidth: width,
				margin: "1rem auto",
				display: "flex",
				flexDirection: "column",
				gap: "0.75rem",
			}}
		>
			{/* Prompt / Instruction banner */}
			{prompt && (
				<div
					style={{
						padding: "0.5rem 0.75rem",
						backgroundColor: "#f8fafc",
						borderLeft: "4px solid var(--ds-navy)",
						borderRadius: "0.25rem",
						fontWeight: 500,
						fontSize: "0.9375rem",
					}}
				>
					🎯 {prompt}
				</div>
			)}

			<Board
				fen={currentFen}
				orientation={orientation}
				size={width}
				arePiecesDraggable={!isSolved && !isOpponentThinking}
				onPieceDrop={handlePieceDrop}
			/>

			{/* Status feedback message */}
			{statusMessage && (
				<div
					style={{
						padding: "0.5rem 0.75rem",
						borderRadius: "0.375rem",
						fontSize: "0.875rem",
						fontWeight: 500,
						textAlign: "center",
						backgroundColor: isSolved ? "#dcfce7" : "#fee2e2",
						color: isSolved ? "#166534" : "#991b1b",
						border: `1px solid ${isSolved ? "#bbf7d0" : "#fecaca"}`,
					}}
				>
					{statusMessage}
				</div>
			)}

			{/* Hint & Solution expansion */}
			{showHint && hintText && (
				<div
					style={{
						padding: "0.5rem 0.75rem",
						backgroundColor: "#fef9c3",
						color: "#854d0e",
						borderRadius: "0.375rem",
						fontSize: "0.8125rem",
						border: "1px solid #fef08a",
					}}
				>
					💡 {hintText}
				</div>
			)}

			{showSolution && (
				<div
					style={{
						padding: "0.5rem 0.75rem",
						backgroundColor: "#f1f5f9",
						color: "#334155",
						borderRadius: "0.375rem",
						fontSize: "0.8125rem",
						border: "1px solid #e2e8f0",
					}}
				>
					<strong>Đáp án: </strong> {solution.join(" ➔ ")}
					{explanation && <div style={{ marginTop: "0.25rem" }}>{explanation}</div>}
				</div>
			)}

			{/* Action toolbar */}
			<div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
				<button type="button" className="ds-button" onClick={handleReset}>
					🔄 {t("retry")}
				</button>
				{hintText && !isSolved && (
					<button type="button" className="ds-button" onClick={() => setShowHint((h) => !h)}>
						💡 {t("hint")}
					</button>
				)}
				<button type="button" className="ds-button" onClick={() => setShowSolution((s) => !s)}>
					👁 {t("showSolution")}
				</button>
			</div>
		</div>
	);
}
