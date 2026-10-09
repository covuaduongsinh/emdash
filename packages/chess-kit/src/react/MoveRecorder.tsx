import { Chess } from "chess.js";
import React, { useState, useEffect, useCallback } from "react";

import { sanToVi } from "../core/notation.js";
import { t } from "../i18n/index.js";
import { Board, type BoardOrientation } from "./Board.js";

export interface MoveRecorderProps {
	fen?: string;
	initialMoves?: string[];
	onChange?: (movesUci: string[]) => void;
	width?: number;
	orientation?: BoardOrientation;
}

export function MoveRecorder({
	fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
	initialMoves = [],
	onChange,
	width = 460,
	orientation = "auto",
}: MoveRecorderProps) {
	const [recordedUci, setRecordedUci] = useState<string[]>(initialMoves);
	const [gameHistory, setGameHistory] = useState<Array<{ san: string; uci: string; fen: string }>>(
		[],
	);

	// Initialize chess game from FEN and replay initial moves
	useEffect(() => {
		const game = new Chess(fen);
		const historyList: Array<{ san: string; uci: string; fen: string }> = [];

		for (const uci of initialMoves) {
			const from = uci.slice(0, 2);
			const to = uci.slice(2, 4);
			const promotion = uci.length > 4 ? uci.slice(4, 5).toLowerCase() : undefined;
			try {
				const move = game.move({ from, to, promotion });
				if (move) {
					historyList.push({
						san: move.san,
						uci,
						fen: game.fen(),
					});
				}
			} catch {
				break;
			}
		}

		setRecordedUci(initialMoves);
		setGameHistory(historyList);
	}, [fen, initialMoves]);

	const currentFen = gameHistory.length > 0 ? gameHistory.at(-1)?.fen || fen : fen;

	const handlePieceDrop = useCallback(
		(sourceSquare: string, targetSquare: string, _piece: string): boolean => {
			const game = new Chess(currentFen);
			try {
				// Try queen promotion by default for drag & drop
				const move = game.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
				if (!move) return false;

				const uci = `${move.from}${move.to}${move.promotion || ""}`;
				const nextUciList = [...recordedUci, uci];
				const nextHistory = [
					...gameHistory,
					{
						san: move.san,
						uci,
						fen: game.fen(),
					},
				];

				setRecordedUci(nextUciList);
				setGameHistory(nextHistory);
				onChange?.(nextUciList);
				return true;
			} catch {
				return false;
			}
		},
		[currentFen, gameHistory, recordedUci, onChange],
	);

	const handleUndo = () => {
		if (recordedUci.length === 0) return;
		const nextUciList = recordedUci.slice(0, -1);
		const nextHistory = gameHistory.slice(0, -1);
		setRecordedUci(nextUciList);
		setGameHistory(nextHistory);
		onChange?.(nextUciList);
	};

	const handleClear = () => {
		setRecordedUci([]);
		setGameHistory([]);
		onChange?.([]);
	};

	return (
		<div
			className="ds-chess-container"
			style={{
				maxWidth: width,
				margin: "0 auto",
				display: "flex",
				flexDirection: "column",
				gap: "0.75rem",
			}}
		>
			<Board
				fen={currentFen}
				orientation={orientation}
				size={width}
				arePiecesDraggable={true}
				onPieceDrop={handlePieceDrop}
			/>

			{/* Controls and Move List */}
			<div
				style={{
					display: "flex",
					gap: "0.5rem",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<div style={{ display: "flex", gap: "0.5rem" }}>
					<button
						type="button"
						className="ds-button"
						onClick={handleUndo}
						disabled={recordedUci.length === 0}
					>
						↩ Quay lại
					</button>
					<button
						type="button"
						className="ds-button"
						onClick={handleClear}
						disabled={recordedUci.length === 0}
					>
						🗑 {t("clearMoves")}
					</button>
				</div>
				<span style={{ fontSize: "0.8125rem", color: "#64748b" }}>
					Đã ghi: {recordedUci.length} nước
				</span>
			</div>

			{/* Recorded moves chip display */}
			<div
				style={{
					display: "flex",
					flexWrap: "wrap",
					gap: "0.375rem",
					padding: "0.5rem",
					backgroundColor: "#f8fafc",
					border: "1px solid #e2e8f0",
					borderRadius: "0.375rem",
					minHeight: "2.5rem",
					alignItems: "center",
					fontSize: "0.875rem",
				}}
			>
				{gameHistory.length === 0 ? (
					<span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: "0.8125rem" }}>
						Kéo thả quân trên bàn cờ để bắt đầu ghi nước đi...
					</span>
				) : (
					gameHistory.map((item, idx) => (
						<span
							key={`${item.uci}-${idx}`}
							style={{
								padding: "0.125rem 0.375rem",
								backgroundColor: "#e2e8f0",
								borderRadius: "0.25rem",
								fontFamily: "monospace",
							}}
						>
							{Math.floor(idx / 2) + 1}.{idx % 2 === 0 ? "" : ".."} {sanToVi(item.san)}
						</span>
					))
				)}
			</div>
		</div>
	);
}
