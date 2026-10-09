import { Chess } from "chess.js";
import React, { useState, useEffect, useCallback } from "react";

import { validateFen } from "../core/fen.js";
import { t } from "../i18n/index.js";
import { Board } from "./Board.js";

export interface PositionEditorProps {
	initialFen?: string;
	onChange?: (fen: string) => void;
	width?: number;
}

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const EMPTY_FEN = "8/8/8/8/8/8/8/8 w - - 0 1";
const SPLIT_WHITESPACE_REGEX = /\s+/;

export function PositionEditor({
	initialFen = START_FEN,
	onChange,
	width = 500,
}: PositionEditorProps) {
	const [fen, setFen] = useState(initialFen);
	const [activeColor, setActiveColor] = useState<"w" | "b">("w");
	const [castling, setCastling] = useState({ K: true, Q: true, k: true, q: true });
	const [orientation, setOrientation] = useState<"white" | "black">("white");
	const [selectedSparePiece, setSelectedSparePiece] = useState<string | null>(null);

	// Sync state from initial FEN
	useEffect(() => {
		try {
			const parts = initialFen.trim().split(SPLIT_WHITESPACE_REGEX);
			if (parts.length >= 3) {
				setActiveColor(parts[1] === "b" ? "b" : "w");
				const c = parts[2] || "-";
				setCastling({
					K: c.includes("K"),
					Q: c.includes("Q"),
					k: c.includes("k"),
					q: c.includes("q"),
				});
			}
			setFen(initialFen);
		} catch {
			// ignore
		}
	}, [initialFen]);

	// Re-construct full FEN when piece placement, active color or castling changes
	const updateFullFen = useCallback(
		(placement: string, color: "w" | "b", cast: typeof castling) => {
			let castStr = "";
			if (cast.K) castStr += "K";
			if (cast.Q) castStr += "Q";
			if (cast.k) castStr += "k";
			if (cast.q) castStr += "q";
			if (!castStr) castStr = "-";

			const newFen = `${placement} ${color} ${castStr} - 0 1`;
			setFen(newFen);
			onChange?.(newFen);
		},
		[onChange],
	);

	const handlePieceDrop = (sourceSquare: string, targetSquare: string, piece: string): boolean => {
		try {
			const game = new Chess(fen);
			game.remove(sourceSquare as any);
			const color = piece[0] === "w" ? "w" : "b";
			const type = piece[1]?.toLowerCase() as any;
			game.put({ type, color }, targetSquare as any);

			const placement = game.fen().split(" ")[0] || "";
			updateFullFen(placement, activeColor, castling);
			return true;
		} catch {
			return false;
		}
	};

	const handleSquareClick = (square: string) => {
		if (selectedSparePiece) {
			try {
				const game = new Chess(fen);
				if (selectedSparePiece === "trash") {
					game.remove(square as any);
				} else {
					const color = selectedSparePiece[0] === "w" ? "w" : "b";
					const type = selectedSparePiece[1]?.toLowerCase() as any;
					game.put({ type, color }, square as any);
				}
				const placement = game.fen().split(" ")[0] || "";
				updateFullFen(placement, activeColor, castling);
			} catch {
				// ignore
			}
		}
	};

	const handleColorChange = (newColor: "w" | "b") => {
		setActiveColor(newColor);
		const placement = fen.split(" ")[0] || "";
		updateFullFen(placement, newColor, castling);
	};

	const handleCastlingChange = (key: keyof typeof castling) => {
		const nextCastling = { ...castling, [key]: !castling[key] };
		setCastling(nextCastling);
		const placement = fen.split(" ")[0] || "";
		updateFullFen(placement, activeColor, nextCastling);
	};

	const handleResetStart = () => {
		setFen(START_FEN);
		setActiveColor("w");
		setCastling({ K: true, Q: true, k: true, q: true });
		onChange?.(START_FEN);
	};

	const handleClearBoard = () => {
		setFen(EMPTY_FEN);
		setActiveColor("w");
		setCastling({ K: false, Q: false, k: false, q: false });
		onChange?.(EMPTY_FEN);
	};

	const validation = validateFen(fen);

	return (
		<div
			className="ds-chess-container"
			style={{
				maxWidth: width,
				margin: "0 auto",
				display: "flex",
				flexDirection: "column",
				gap: "1rem",
			}}
		>
			<Board
				fen={fen}
				orientation={orientation}
				size={width}
				arePiecesDraggable={true}
				onPieceDrop={handlePieceDrop}
				onSquareClick={handleSquareClick}
				customSquareStyles={{}}
			/>

			{/* Spare pieces palette */}
			<div
				style={{
					display: "flex",
					flexWrap: "wrap",
					gap: "0.5rem",
					justifyContent: "center",
					padding: "0.5rem",
					backgroundColor: "#f8fafc",
					border: "1px solid #e2e8f0",
					borderRadius: "0.5rem",
				}}
			>
				{["wK", "wQ", "wR", "wB", "wN", "wP", "bK", "bQ", "bR", "bB", "bN", "bP"].map((piece) => (
					<button
						key={piece}
						type="button"
						onClick={() => setSelectedSparePiece(selectedSparePiece === piece ? null : piece)}
						className="ds-button"
						style={{
							padding: "0.25rem 0.5rem",
							fontWeight: "bold",
							backgroundColor: selectedSparePiece === piece ? "var(--ds-navy)" : undefined,
							color: selectedSparePiece === piece ? "#ffffff" : undefined,
						}}
					>
						{piece}
					</button>
				))}
				<button
					type="button"
					onClick={() => setSelectedSparePiece(selectedSparePiece === "trash" ? null : "trash")}
					className="ds-button"
					style={{
						padding: "0.25rem 0.5rem",
						backgroundColor: selectedSparePiece === "trash" ? "#ef4444" : undefined,
						color: selectedSparePiece === "trash" ? "#ffffff" : undefined,
					}}
					title="Xóa quân khi click vào ô"
				>
					🗑 Xóa ô
				</button>
			</div>

			{/* Options controls */}
			<div
				style={{
					display: "flex",
					flexWrap: "wrap",
					gap: "1rem",
					justifyContent: "space-between",
					fontSize: "0.875rem",
				}}
			>
				{/* Side to move */}
				<div>
					<strong>{t("sideToMove")}: </strong>
					<label style={{ marginRight: "0.5rem", cursor: "pointer" }}>
						<input
							type="radio"
							name="side"
							checked={activeColor === "w"}
							onChange={() => handleColorChange("w")}
						/>{" "}
						{t("white")}
					</label>
					<label style={{ cursor: "pointer" }}>
						<input
							type="radio"
							name="side"
							checked={activeColor === "b"}
							onChange={() => handleColorChange("b")}
						/>{" "}
						{t("black")}
					</label>
				</div>

				{/* Castling rights */}
				<div>
					<strong>{t("castlingRights")}: </strong>
					{(["K", "Q", "k", "q"] as const).map((c) => (
						<label key={c} style={{ marginRight: "0.375rem", cursor: "pointer" }}>
							<input
								type="checkbox"
								checked={castling[c]}
								onChange={() => handleCastlingChange(c)}
							/>{" "}
							{c}
						</label>
					))}
				</div>
			</div>

			{/* Action buttons */}
			<div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
				<button type="button" className="ds-button" onClick={handleResetStart}>
					{t("startingPosition")}
				</button>
				<button type="button" className="ds-button" onClick={handleClearBoard}>
					{t("clearBoard")}
				</button>
				<button
					type="button"
					className="ds-button"
					onClick={() => setOrientation((o) => (o === "white" ? "black" : "white"))}
				>
					🔄 {t("flipBoard")}
				</button>
			</div>

			{/* FEN output & status */}
			<div style={{ fontSize: "0.8125rem" }}>
				<div style={{ marginBottom: "0.25rem", color: validation.valid ? "#16a34a" : "#dc2626" }}>
					{validation.valid ? "✓ Thế cờ hợp lệ" : `⚠ ${validation.error}`}
				</div>
				<input
					type="text"
					readOnly
					value={fen}
					style={{
						width: "100%",
						padding: "0.375rem 0.5rem",
						borderRadius: "0.25rem",
						border: "1px solid #cbd5e1",
						fontFamily: "monospace",
						backgroundColor: "#f8fafc",
					}}
				/>
			</div>
		</div>
	);
}
