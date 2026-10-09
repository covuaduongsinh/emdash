import { markLectureCompleted } from "@duongsinh/chess-kit/progress";
import { LecturePlayer, type LectureStep } from "@duongsinh/chess-kit/react";
import React, { useCallback } from "react";

export interface LectureIslandProps {
	lectureId?: string;
	title?: string;
	steps: LectureStep[];
	showTeacherNotes?: boolean;
	width?: number;
	className?: string;
}

export function LectureIsland({
	lectureId,
	title,
	steps,
	showTeacherNotes = false,
	width = 760,
	className = "",
}: LectureIslandProps) {
	const handleCompleted = useCallback(
		(completedId?: string) => {
			const id = completedId || lectureId;
			if (id) {
				markLectureCompleted(id);

				// Phát sự kiện giao thức hoàn thành yêu cầu của LMS
				if (typeof window !== "undefined") {
					window.dispatchEvent(
						new CustomEvent("lms:requirement-done", {
							detail: { requirement: `lecture:${id}` },
						}),
					);

					window.dispatchEvent(
						new CustomEvent("duongsinh-chess:lecture-completed", {
							detail: { lectureId: id, title },
						}),
					);
				}
			}
		},
		[lectureId, title],
	);

	return (
		<div className={`ds-chess-lecture-island ${className}`}>
			<LecturePlayer
				lectureId={lectureId}
				title={title}
				steps={steps}
				showTeacherNotes={showTeacherNotes}
				onCompleted={handleCompleted}
				width={width}
			/>
		</div>
	);
}

export default LectureIsland;
