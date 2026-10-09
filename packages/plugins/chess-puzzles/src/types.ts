import type { ChessLevel } from "@duongsinh/chess-kit/core";

export type PuzzleOrientation = "white" | "black" | "auto";

export interface PuzzleData {
	fen: string;
	moves?: string[];
	solution?: string[];
	orientation?: "white" | "black";
	initialPly?: number;
}

export interface ChessPuzzleRecord {
	id: string;
	slug?: string;
	title: string;
	puzzle: PuzzleData;
	prompt?: string | null;
	level: ChessLevel["id"] | string;
	themes?: string | null;
	rating?: number | null;
	hint?: string | null;
	explanation?: unknown;
	source?: string | null;
	status?: "draft" | "published" | "archived" | string;
	createdAt?: string;
	updatedAt?: string;
}

export interface ChessPuzzlesPluginOptions {
	/** Default board orientation ("auto" follows side to move in FEN) */
	defaultOrientation?: PuzzleOrientation;
	/** Number of incorrect attempts before showing hint/solution (default: 3) */
	revealAfterFailures?: number;
	/** Show Elo rating on puzzle widgets */
	showRating?: boolean;
}

export interface PuzzleSnapshot {
	id?: string;
	puzzleId?: string;
	title?: string;
	prompt?: string;
	hint?: string;
	level?: string;
	fen: string;
	solution: string[];
	orientation?: "white" | "black";
	explanation?: unknown;
}

export interface PuzzleImportItem {
	title?: string;
	fen: string;
	moves: string[];
	rating?: number;
	level?: ChessLevel["id"] | string;
	themes?: string;
	prompt?: string;
	hint?: string;
	source?: string;
}

export interface PuzzleImportResult {
	totalParsed: number;
	imported: number;
	errors: Array<{ line: number; error: string }>;
}
