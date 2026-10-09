import {
	Board,
	type BoardOrientation,
	type BoardSize,
	PgnViewer,
} from "@duongsinh/chess-kit/react";
import React from "react";

export interface ChessBoardIslandProps {
	fen?: string;
	pgn?: string;
	orientation?: BoardOrientation;
	caption?: string;
	arrows?: string;
	highlights?: string;
	size?: BoardSize;
	startPly?: number;
	showHeaders?: boolean;
	className?: string;
}

export function ChessBoardIsland({
	fen,
	pgn,
	orientation = "white",
	caption,
	arrows,
	highlights,
	size = "M",
	startPly,
	showHeaders = true,
	className = "",
}: ChessBoardIslandProps) {
	// Nếu có chuỗi PGN -> hiển thị PgnViewer đầy đủ tương tác và duyệt nước cờ
	if (pgn && pgn.trim().length > 0) {
		return (
			<div className={`chess-island-pgn ${className}`.trim()}>
				<PgnViewer
					pgn={pgn}
					orientation={orientation === "auto" ? "white" : orientation}
					startPly={startPly}
					showHeaders={showHeaders}
					caption={caption}
				/>
			</div>
		);
	}

	// Nếu là thế cờ tĩnh FEN -> hiển thị bàn cờ Board kèm chú thích
	const resolvedFen =
		fen && fen.trim().length > 0
			? fen.trim()
			: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

	return (
		<figure
			style={{
				maxWidth: typeof size === "number" ? size : size === "S" ? 320 : size === "L" ? 600 : 460,
				margin: "20px auto",
				textAlign: "center",
			}}
			className={`chess-island-fen ${className}`.trim()}
		>
			<Board
				fen={resolvedFen}
				orientation={orientation}
				arrows={arrows}
				highlights={highlights}
				size={size}
			/>
			{caption && (
				<figcaption
					style={{
						marginTop: "8px",
						fontSize: "0.875rem",
						color: "var(--kumo-subtle, #6b7280)",
						fontStyle: "italic",
					}}
				>
					{caption}
				</figcaption>
			)}
		</figure>
	);
}

export default ChessBoardIsland;
