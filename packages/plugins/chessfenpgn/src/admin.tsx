import type { PluginAdminExports } from "emdash";
import React, { useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { Button, InputArea } from "@cloudflare/kumo";

// =============================================================================
// Field Widget
// =============================================================================
function ChessWidget({ value, onChange }: { value: unknown; onChange: (val: string) => void }) {
	const [game, setGame] = useState(() => {
		try {
			return new Chess(typeof value === "string" && value ? value : undefined);
		} catch (e) {
			return new Chess();
		}
	});

	function onDrop(sourceSquare: string, targetSquare: string) {
		try {
			const move = game.move({
				from: sourceSquare,
				to: targetSquare,
				promotion: "q",
			});

			if (move === null) return false;

			const newGame = new Chess(game.fen());
			setGame(newGame);
			if (onChange) onChange(newGame.fen());
			return true;
		} catch (e) {
			return false;
		}
	}

	return (
		<div style={{ maxWidth: 400 }}>
			<Chessboard position={game.fen()} onPieceDrop={onDrop} />
			<div className="mt-2 text-xs text-kumo-subtle break-all">{game.fen()}</div>
		</div>
	);
}

// =============================================================================
// Admin Page (Tools)
// =============================================================================
function ChessEditorPage() {
	const [game, setGame] = useState(new Chess());

	function onDrop(sourceSquare: string, targetSquare: string) {
		try {
			const move = game.move({
				from: sourceSquare,
				to: targetSquare,
				promotion: "q",
			});

			if (move === null) return false;

			const newGame = new Chess(game.fen());
			// Maintain PGN history
			newGame.loadPgn(game.pgn());
			setGame(newGame);
			return true;
		} catch (e) {
			return false;
		}
	}

	function reset() {
		setGame(new Chess());
	}

	return (
		<div className="p-8 max-w-4xl mx-auto">
			<h1 className="text-2xl font-bold mb-4">Trình Soạn Thảo Cờ Vua</h1>
			<p className="mb-6 text-kumo-subtle">
				Di chuyển quân cờ để tạo thế cờ hoặc diễn biến ván đấu. Copy mã FEN/PGN bên dưới để dán vào bài viết.
			</p>
			
			<div className="flex gap-8 items-start">
				<div className="w-96 shrink-0">
					<Chessboard position={game.fen()} onPieceDrop={onDrop} />
					<div className="mt-4 flex gap-2">
						<Button onClick={reset} variant="secondary">Làm mới</Button>
					</div>
				</div>
				
				<div className="flex-1 space-y-4">
					<div>
						<h3 className="font-semibold mb-2">Chuỗi FEN (Thế cờ tĩnh):</h3>
						<InputArea 
							readOnly 
							value={game.fen()} 
							className="font-mono"
							rows={3}
							onFocus={(e) => e.target.select()}
						/>
					</div>
					<div>
						<h3 className="font-semibold mb-2">Chuỗi PGN (Diễn biến):</h3>
						<InputArea 
							readOnly 
							value={game.pgn()} 
							className="font-mono"
							rows={6}
							onFocus={(e) => e.target.select()}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

// =============================================================================
// Exports
// =============================================================================

export const fields: PluginAdminExports["fields"] = {
	"chess-board": ChessWidget,
};

export const pages: PluginAdminExports["pages"] = {
	"/editor": ChessEditorPage,
};
