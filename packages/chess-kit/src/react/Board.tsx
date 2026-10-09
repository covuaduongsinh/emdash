import React, { useMemo } from "react";
import { Chessboard } from "react-chessboard";
import type { Arrow, Square } from "react-chessboard/dist/chessboard/types";

import {
	parseArrows,
	parseSquares,
	type ArrowAnnotation,
	type SquareAnnotation,
} from "../core/annotations.js";

export type BoardOrientation = "white" | "black" | "auto";
export type BoardSize = "S" | "M" | "L" | number;

export interface BoardProps {
	fen?: string;
	orientation?: BoardOrientation;
	arrows?: string | ArrowAnnotation[];
	highlights?: string | Record<string, SquareAnnotation>;
	size?: BoardSize;
	arePiecesDraggable?: boolean;
	onPieceDrop?: (sourceSquare: string, targetSquare: string, piece: string) => boolean;
	onSquareClick?: (square: string) => void;
	customBoardStyle?: React.CSSProperties;
	customDarkSquareStyle?: Record<string, string>;
	customLightSquareStyle?: Record<string, string>;
	customArrows?: Arrow[];
	customSquareStyles?: Record<string, Record<string, string | number>>;
	id?: string;
}

const SIZE_MAP: Record<"S" | "M" | "L", number> = {
	S: 320,
	M: 460,
	L: 600,
};

const SPLIT_WHITESPACE_REGEX = /\s+/;

export function Board({
	fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
	orientation = "white",
	arrows,
	highlights,
	size = "M",
	arePiecesDraggable = false,
	onPieceDrop,
	onSquareClick,
	customBoardStyle,
	customDarkSquareStyle = { backgroundColor: "var(--ds-board-dark, #7A90A8)" },
	customLightSquareStyle = { backgroundColor: "var(--ds-board-light, #F0F3F8)" },
	customArrows,
	customSquareStyles,
	id,
}: BoardProps) {
	const boardWidth = typeof size === "number" ? size : SIZE_MAP[size] || 460;

	// Resolve auto orientation based on active color in FEN
	const resolvedOrientation = useMemo(() => {
		if (orientation === "auto") {
			const activeColor = fen.trim().split(SPLIT_WHITESPACE_REGEX)[1];
			return activeColor === "b" ? "black" : "white";
		}
		return orientation;
	}, [orientation, fen]);

	// Convert parsed arrows into react-chessboard format [from, to, color]
	const resolvedCustomArrows = useMemo(() => {
		if (customArrows) return customArrows;
		if (!arrows) return [];

		const parsed = typeof arrows === "string" ? parseArrows(arrows) : arrows;
		return parsed.map((a) => {
			const color = a.color || "rgba(245, 166, 35, 0.8)";
			return [a.from as Square, a.to as Square, color] as Arrow;
		});
	}, [arrows, customArrows]);

	// Convert parsed highlights into customSquareStyles
	const resolvedSquareStyles = useMemo(() => {
		const styles: Record<string, Record<string, string | number>> = { ...customSquareStyles };
		if (!highlights) return styles;

		const parsed = typeof highlights === "string" ? parseSquares(highlights) : highlights;
		for (const [sq, annot] of Object.entries(parsed)) {
			const color = annot.color || "var(--ds-board-highlight, rgba(245, 166, 35, 0.5))";
			styles[sq] = {
				...styles[sq],
				backgroundColor: color,
			};
		}
		return styles;
	}, [highlights, customSquareStyles]);

	return (
		<div
			className="ds-chess-board-wrapper"
			style={{
				maxWidth: boardWidth,
				width: "100%",
				margin: "0 auto",
				...customBoardStyle,
			}}
		>
			<Chessboard
				id={id}
				position={fen}
				boardOrientation={resolvedOrientation}
				boardWidth={boardWidth}
				arePiecesDraggable={arePiecesDraggable}
				onPieceDrop={onPieceDrop as any}
				onSquareClick={onSquareClick}
				customDarkSquareStyle={customDarkSquareStyle}
				customLightSquareStyle={customLightSquareStyle}
				customArrows={resolvedCustomArrows}
				customSquareStyles={resolvedSquareStyles}
				animationDuration={200}
			/>
		</div>
	);
}
