import LectureBlock from "./LectureBlock.astro";
import LectureIsland from "./LectureIsland.jsx";
import LecturePage from "./LecturePage.astro";
import LecturePresenter from "./LecturePresenter.astro";
import LecturePresenterIsland from "./LecturePresenterIsland.jsx";

export const blockComponents = {
	"chess-lecture": LectureBlock,
};

export { LectureBlock, LectureIsland, LecturePage, LecturePresenter, LecturePresenterIsland };

export default blockComponents;
