import ChessFenComponent from "./ChessFen.astro";
import ChessPgnComponent from "./ChessPgn.astro";

// Exported as blockComponents for auto-registration via the virtual module
export const blockComponents = {
	"chess-fen": ChessFenComponent,
	"chess-pgn": ChessPgnComponent,
} as const;
