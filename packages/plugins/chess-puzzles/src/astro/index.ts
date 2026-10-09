export { default as PuzzleBlock } from "./PuzzleBlock.astro";
export { default as PuzzlePage } from "./PuzzlePage.astro";
export { default as PuzzleOfTheDay } from "./PuzzleOfTheDay.astro";
export { default as PuzzleIsland } from "./PuzzleIsland.jsx";

import PuzzleBlock from "./PuzzleBlock.astro";

/**
 * Mapping các thành phần Astro cho Portable Text block của plugin
 */
export const blockComponents = {
	"chess-puzzle": PuzzleBlock,
};

export default blockComponents;
