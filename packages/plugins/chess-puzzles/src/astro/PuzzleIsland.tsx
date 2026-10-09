import { markPuzzleSolved } from "@duongsinh/chess-kit/progress";
import { PuzzlePlayer, type BoardOrientation } from "@duongsinh/chess-kit/react";
import React, { useCallback } from "react";

export interface PuzzleIslandProps {
	puzzleId?: string;
	fen: string;
	solution: string[] | string;
	prompt?: string;
	hint?: string;
	explanation?: string;
	level?: string;
	orientation?: BoardOrientation;
	width?: number;
	className?: string;
}

const WHITESPACE_SPLIT_REGEX = /\s+/;

export function PuzzleIsland({
	puzzleId,
	fen,
	solution,
	prompt,
	hint,
	explanation,
	level,
	orientation = "auto",
	width = 460,
	className = "",
}: PuzzleIslandProps) {
	const solutionArray = Array.isArray(solution)
		? solution
		: typeof solution === "string"
			? solution.split(WHITESPACE_SPLIT_REGEX).filter(Boolean)
			: [];

	const handleSolved = useCallback(
		(solvedId?: string) => {
			const id = solvedId || puzzleId || "custom";

			// 1. Lưu tiến độ câu đố vào local progress của @duongsinh/chess-kit
			try {
				markPuzzleSolved(id);
			} catch {
				// Bỏ qua nếu môi trường không có localStorage
			}

			// 2. Phát sự kiện hoàn thành requirement cho LMS
			if (typeof window !== "undefined") {
				window.dispatchEvent(
					new CustomEvent("lms:requirement-done", {
						detail: { requirement: `puzzle:${id}` },
					}),
				);

				// 3. Phát sự kiện chung của hệ sinh thái cờ Dương Sinh
				window.dispatchEvent(
					new CustomEvent("duongsinh-chess:puzzle-solved", {
						detail: { puzzleId: id, level, fen },
					}),
				);
			}
		},
		[puzzleId, fen, level],
	);

	return (
		<div className={`chess-puzzle-island ${className}`}>
			<PuzzlePlayer
				puzzleId={puzzleId}
				fen={fen}
				solution={solutionArray}
				prompt={prompt}
				hint={hint}
				explanation={explanation}
				orientation={orientation}
				onSolved={handleSolved}
				width={width}
			/>
		</div>
	);
}

export default PuzzleIsland;
