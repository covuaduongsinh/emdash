import type { ChessLevelId } from "@duongsinh/chess-kit/core";
import type { BoardOrientation } from "@duongsinh/chess-kit/react";

export interface ChessLessonsPluginOptions {
	defaultOrientation?: "auto" | "white" | "black";
	showTeacherNotesInPresenter?: boolean;
}

export interface LectureStep {
	id?: string;
	title?: string;
	fen: string;
	move?: string;
	arrows?: string;
	highlights?: string;
	narration: string;
	teacherNotes?: string;
	orientation?: BoardOrientation;
	question?: {
		prompt: string;
		answer?: string;
	};
}

export interface ChessLectureScript {
	steps: LectureStep[];
}

export interface ChessLectureRecord {
	id: string;
	slug: string;
	title: string;
	level?: ChessLevelId;
	course?: string;
	summary?: string;
	script: ChessLectureScript | string;
	status?: "draft" | "published" | "archived";
	created_at?: string;
	updated_at?: string;
}

export interface ObsidianLessonFrontmatter {
	title: string;
	course?: string;
	module?: string;
	order?: number;
	level?: ChessLevelId | string;
	themes?: string;
	objectives?: string;
	[key: string]: unknown;
}

export interface ObsidianImportResult {
	success: boolean;
	lessonId?: string;
	courseId?: string;
	moduleId?: string;
	title: string;
	warnings: string[];
	blocksCount: number;
	status: "draft";
}

export interface CurriculumSeedResult {
	success: boolean;
	createdCourses: string[];
	skippedCourses: string[];
	createdModules: string[];
}

export interface SampleLessonSeedResult {
	success: boolean;
	courseId: string;
	moduleId: string;
	lessonId: string;
	title: string;
	slug: string;
}

export interface DemoDataSeedResult {
	success: boolean;
	courseId: string;
	createdLessons: string[];
	lectureId: string;
	quizId: string;
	puzzlesCreated: number;
}
