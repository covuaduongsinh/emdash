import React, { useState, useEffect, useMemo, useCallback } from "react";

import { sanToVi } from "../core/notation.js";
import { parsePgn, replayPositions } from "../core/pgn.js";
import { t } from "../i18n/index.js";
import { Board, type BoardOrientation } from "./Board.js";

export interface PgnViewerProps {
	pgn: string;
	orientation?: BoardOrientation;
	startPly?: number;
	showHeaders?: boolean;
	caption?: string;
	width?: number;
	className?: string;
}

export function PgnViewer({
	pgn,
	orientation = "white",
	startPly,
	showHeaders = true,
	caption,
	width = 720,
	className = "",
}: PgnViewerProps) {
	const parsed = useMemo(() => parsePgn(pgn), [pgn]);
	const fens = useMemo(() => replayPositions(pgn), [pgn]);

	const [currentIndex, setCurrentIndex] = useState(() => {
		if (typeof startPly === "number" && startPly >= 0 && startPly < fens.length) {
			return startPly;
		}
		return 0;
	});

	const [boardOrientation, setBoardOrientation] = useState<"white" | "black">(
		orientation === "black" ? "black" : "white",
	);
	const [useViNotation, setUseViNotation] = useState(true);

	useEffect(() => {
		if (typeof startPly === "number" && startPly >= 0 && startPly < fens.length) {
			setCurrentIndex(startPly);
		} else {
			setCurrentIndex(0);
		}
	}, [startPly, fens.length]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (e.key === "ArrowLeft") {
				e.preventDefault();
				setCurrentIndex((c) => Math.max(0, c - 1));
			} else if (e.key === "ArrowRight") {
				e.preventDefault();
				setCurrentIndex((c) => Math.min(fens.length - 1, c + 1));
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				setCurrentIndex(0);
			} else if (e.key === "ArrowDown") {
				e.preventDefault();
				setCurrentIndex(fens.length - 1);
			}
		},
		[fens.length],
	);

	// Pair moves for the notation display table
	const movePairs = useMemo(() => {
		const moves = parsed.tree.moves;
		const pairs: Array<{
			moveNumber: number;
			white: { san: string; index: number; comment?: string };
			black?: { san: string; index: number; comment?: string };
		}> = [];

		for (let i = 0; i < moves.length; i += 2) {
			const whiteMove = moves[i];
			const blackMove = moves[i + 1];
			if (whiteMove) {
				pairs.push({
					moveNumber: Math.floor(i / 2) + 1,
					white: {
						san: useViNotation ? sanToVi(whiteMove.san) : whiteMove.san,
						index: i + 1,
						comment: whiteMove.comment,
					},
					black: blackMove
						? {
								san: useViNotation ? sanToVi(blackMove.san) : blackMove.san,
								index: i + 2,
								comment: blackMove.comment,
							}
						: undefined,
				});
			}
		}
		return pairs;
	}, [parsed.tree.moves, useViNotation]);

	const currentFen = fens[currentIndex] || fens[0];
	const isAtStart = currentIndex === 0;
	const isAtEnd = currentIndex === fens.length - 1;

	return (
		<div
			className={`ds-chess-container ${className}`}
			style={{
				maxWidth: width,
				margin: "1rem auto",
				outline: "none",
			}}
			tabIndex={0}
			onKeyDown={handleKeyDown}
		>
			{/* Headers / Metadata */}
			{showHeaders && Object.keys(parsed.headers).length > 0 && (
				<div
					style={{
						padding: "0.75rem 1rem",
						backgroundColor: "#f8fafc",
						border: "1px solid #e2e8f0",
						borderRadius: "0.5rem",
						marginBottom: "1rem",
						fontSize: "0.875rem",
					}}
				>
					<div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
						<span>
							{parsed.headers.White || t("white")} vs {parsed.headers.Black || t("black")}
						</span>
						<span>{parsed.headers.Result || ""}</span>
					</div>
					{(parsed.headers.Event || parsed.headers.Date) && (
						<div style={{ color: "#64748b", fontSize: "0.8125rem", marginTop: "0.25rem" }}>
							{parsed.headers.Event} {parsed.headers.Date ? `(${parsed.headers.Date})` : ""}
						</div>
					)}
				</div>
			)}

			<div
				style={{
					display: "flex",
					flexWrap: "wrap",
					gap: "1.25rem",
					justifyContent: "center",
				}}
			>
				{/* Chessboard Column */}
				<div style={{ flex: "1 1 320px", maxWidth: 440 }}>
					<Board fen={currentFen} orientation={boardOrientation} size={440} />

					{/* Navigation controls */}
					<div
						style={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							gap: "0.5rem",
							marginTop: "0.75rem",
						}}
					>
						<button
							type="button"
							className="ds-button"
							onClick={() => setCurrentIndex(0)}
							disabled={isAtStart}
							title={t("firstMove")}
						>
							⏮
						</button>
						<button
							type="button"
							className="ds-button"
							onClick={() => setCurrentIndex((c) => Math.max(0, c - 1))}
							disabled={isAtStart}
							title={t("prevMove")}
						>
							◀
						</button>
						<button
							type="button"
							className="ds-button"
							onClick={() => setCurrentIndex((c) => Math.min(fens.length - 1, c + 1))}
							disabled={isAtEnd}
							title={t("nextMove")}
						>
							▶
						</button>
						<button
							type="button"
							className="ds-button"
							onClick={() => setCurrentIndex(fens.length - 1)}
							disabled={isAtEnd}
							title={t("lastMove")}
						>
							⏭
						</button>
						<button
							type="button"
							className="ds-button"
							onClick={() => setBoardOrientation((o) => (o === "white" ? "black" : "white"))}
							title={t("flipBoard")}
							style={{ marginLeft: "0.5rem" }}
						>
							🔄
						</button>
						<button
							type="button"
							className="ds-button"
							onClick={() => setUseViNotation((v) => !v)}
							title={t("notationToggle")}
							style={{ fontSize: "0.75rem", fontWeight: 600 }}
						>
							{useViNotation ? "VN" : "INT"}
						</button>
					</div>

					{caption && (
						<p
							style={{
								textAlign: "center",
								fontSize: "0.875rem",
								color: "#64748b",
								marginTop: "0.5rem",
								fontStyle: "italic",
							}}
						>
							{caption}
						</p>
					)}
				</div>

				{/* Move List / Notation Table */}
				<div
					style={{
						flex: "1 1 240px",
						maxHeight: 440,
						overflowY: "auto",
						backgroundColor: "#ffffff",
						border: "1px solid #e2e8f0",
						borderRadius: "0.5rem",
						padding: "0.75rem",
						display: "flex",
						flexDirection: "column",
					}}
				>
					<div
						style={{
							fontSize: "0.875rem",
							fontWeight: 600,
							color: "#475569",
							borderBottom: "1px solid #e2e8f0",
							paddingBottom: "0.5rem",
							marginBottom: "0.5rem",
						}}
					>
						Biên bản ván cờ
					</div>

					<div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
						{movePairs.map((pair) => (
							<div key={pair.moveNumber}>
								<div style={{ display: "flex", alignItems: "center", fontSize: "0.9375rem" }}>
									<span style={{ width: "2.25rem", color: "#94a3b8", userSelect: "none" }}>
										{pair.moveNumber}.
									</span>
									<span
										className={`ds-move-item ${currentIndex === pair.white.index ? "active" : ""}`}
										onClick={() => setCurrentIndex(pair.white.index)}
										style={{ flex: 1 }}
									>
										{pair.white.san}
									</span>
									{pair.black ? (
										<span
											className={`ds-move-item ${currentIndex === pair.black.index ? "active" : ""}`}
											onClick={() => {
												if (pair.black) setCurrentIndex(pair.black.index);
											}}
											style={{ flex: 1 }}
										>
											{pair.black.san}
										</span>
									) : null}
								</div>

								{/* Comments if any */}
								{pair.white.comment && (
									<div
										style={{
											fontSize: "0.8125rem",
											color: "#0369a1",
											backgroundColor: "#f0f9ff",
											padding: "0.25rem 0.5rem",
											borderRadius: "0.25rem",
											margin: "0.25rem 0 0.25rem 2.25rem",
										}}
									>
										💬 {pair.white.comment}
									</div>
								)}
								{pair.black?.comment && (
									<div
										style={{
											fontSize: "0.8125rem",
											color: "#0369a1",
											backgroundColor: "#f0f9ff",
											padding: "0.25rem 0.5rem",
											borderRadius: "0.25rem",
											margin: "0.25rem 0 0.25rem 2.25rem",
										}}
									>
										💬 {pair.black?.comment}
									</div>
								)}
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
