import { describe, expect, it } from "vitest";

import { adminStudentsRoute } from "../src/routes/admin-students.js";
import { meAccessRoute } from "../src/routes/me-access.js";
import { meEnrollRoute } from "../src/routes/me-enroll.js";
import { meProgressRoute } from "../src/routes/me-progress.js";
import { progressCompleteRoute } from "../src/routes/progress-complete.js";
import { progressSyncRoute } from "../src/routes/progress-sync.js";

describe("Student & LMS Route Handlers", () => {
	it("meAccessRoute: rejects unauthenticated requests", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await expect(meAccessRoute({ input: { courseId: "c1" } } as any)).rejects.toThrow(
			/Authentication required/,
		);
	});

	it("meAccessRoute: grants access to free courses for authenticated user", async () => {
		const mockContext = {
			user: { id: "user-123", email: "student@dsc.vn" },
			input: { courseId: "course-free" },
			content: {
				get: async (coll: string, id: string) => {
					if (coll === "courses" && id === "course-free") {
						return { id: "course-free", data: { title: "Cờ Vua Vỡ Lòng", access_level: "free" } };
					}
					return null;
				},
				list: async () => ({ items: [], nextCursor: undefined }),
			},
		};

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = (await meAccessRoute(mockContext as any)) as { hasAccess: boolean };
		expect(result.hasAccess).toBe(true);
	});

	it("meAccessRoute: denies paid course if user has no membership or enrollment", async () => {
		const mockContext = {
			user: { id: "user-123", email: "student@dsc.vn" },
			input: { courseId: "course-paid" },
			content: {
				get: async (coll: string, id: string) => {
					if (coll === "courses" && id === "course-paid") {
						return {
							id: "course-paid",
							data: { title: "Chiến thuật Nâng cao", access_level: "membership" },
						};
					}
					return null;
				},
				list: async () => ({ items: [], nextCursor: undefined }),
			},
		};

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = (await meAccessRoute(mockContext as any)) as { hasAccess: boolean };
		expect(result.hasAccess).toBe(false);
	});

	it("meEnrollRoute: self-enrolls into free course and prevents enrolling in paid course", async () => {
		let createdRecord: Record<string, unknown> | null = null;

		const mockContext = {
			user: { id: "user-123", email: "student@dsc.vn" },
			input: { courseId: "course-free" },
			content: {
				get: async (_: string, id: string) => {
					if (id === "course-free") {
						return { id: "course-free", data: { access_level: "free" } };
					}
					if (id === "course-paid") {
						return { id: "course-paid", data: { access_level: "membership" } };
					}
					return null;
				},
				list: async () => ({ items: [] }),
				create: async (_: string, data: Record<string, unknown>) => {
					createdRecord = data;
					return { id: "enr-1", data };
				},
			},
		};

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const res = await meEnrollRoute(mockContext as any);
		expect(res.success).toBe(true);
		expect(createdRecord).toMatchObject({
			user_id: "user-123",
			course_id: "course-free",
			progress: 0,
		});

		// Paid course must throw forbidden
		mockContext.input = { courseId: "course-paid" };
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await expect(meEnrollRoute(mockContext as any)).rejects.toThrow(
			/requires a library membership/,
		);
	});

	it("progressCompleteRoute: records lesson progress and recalculates course progress", async () => {
		const progressRecords: Record<string, unknown>[] = [];
		let enrollmentUpdated: Record<string, unknown> | null = null;

		const mockContext = {
			user: { id: "user-123", email: "student@dsc.vn" },
			input: { lessonId: "les-1", courseId: "c1" },
			content: {
				get: async (_: string, id: string) => {
					if (id === "les-1") return { id: "les-1", data: { course_id: "c1", module_id: "m1" } };
					return null;
				},
				list: async (coll: string) => {
					if (coll === "lessons") {
						return {
							items: [
								{ id: "les-1", data: { course_id: "c1" } },
								{ id: "les-2", data: { course_id: "c1" } },
							],
						};
					}
					if (coll === "lesson_progress") {
						return { items: progressRecords.map((r, i) => ({ id: `p-${i}`, data: r })) };
					}
					if (coll === "enrollments") {
						return {
							items: [{ id: "enr-1", data: { user_id: "user-123", course_id: "c1", progress: 0 } }],
						};
					}
					return { items: [] };
				},
				create: async (coll: string, data: Record<string, unknown>) => {
					if (coll === "lesson_progress") progressRecords.push(data);
					return { id: "p-new", data };
				},
				update: async (coll: string, _: string, data: Record<string, unknown>) => {
					if (coll === "enrollments") enrollmentUpdated = data;
					return { id: "enr-1", data };
				},
			},
		};

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const res = await progressCompleteRoute(mockContext as any);
		expect(res.success).toBe(true);
		expect(res.progress).toBe(50); // 1 out of 2 lessons completed
		expect(enrollmentUpdated).toMatchObject({ progress: 50 });
	});

	it("progressSyncRoute: syncs client localStorage lessons to server", async () => {
		const createdLessons: string[] = [];

		const mockContext = {
			user: { id: "user-123", email: "student@dsc.vn" },
			input: {
				progress: {
					lessons: {
						"les-1": { completed: true, completedAt: "2026-10-09T08:00:00Z" },
						"les-2": { completed: false },
					},
				},
			},
			content: {
				get: async (_: string, id: string) => ({ id, data: { course_id: "c1" } }),
				list: async () => ({ items: [] }),
				create: async (_: string, data: Record<string, unknown>) => {
					createdLessons.push(data.lesson_id as string);
					return { id: "p-1", data };
				},
				update: async () => ({ id: "p-1", data: {} }),
			},
		};

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const res = await progressSyncRoute(mockContext as any);
		expect(res.success).toBe(true);
		expect(res.syncedCount).toBe(1);
		expect(createdLessons).toEqual(["les-1"]);
	});

	it("meProgressRoute: returns completed lesson ids and overall progress", async () => {
		const mockContext = {
			user: { id: "user-123", email: "student@dsc.vn" },
			input: { courseId: "c1" },
			content: {
				list: async (coll: string) => {
					if (coll === "lesson_progress") {
						return { items: [{ id: "p-1", data: { lesson_id: "les-1", completed: true } }] };
					}
					if (coll === "enrollments") {
						return { items: [{ id: "enr-1", data: { progress: 50 } }] };
					}
					return { items: [] };
				},
			},
		};

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const res = await meProgressRoute(mockContext as any);
		expect(res.success).toBe(true);
		expect(res.completedLessonIds).toEqual(["les-1"]);
		expect(res.progress).toBe(50);
	});

	it("adminStudentsRoute: lists enrollments and handles manual enrollment", async () => {
		const mockContext = {
			input: { action: "list", courseId: "c1" },
			users: {
				get: async (id: string) => ({ id, name: "Nguyễn Văn A", email: "a@gmail.com" }),
				getByEmail: async (email: string) => ({ id: "u-99", name: "Trần B", email }),
			},
			content: {
				list: async () => ({
					items: [{ id: "enr-1", data: { user_id: "u-1", course_id: "c1", progress: 80 } }],
				}),
				create: async (_: string, data: Record<string, unknown>) => ({ id: "enr-new", data }),
			},
		};

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const listRes = (await adminStudentsRoute(mockContext as any)) as {
			items: Array<Record<string, unknown>>;
		};
		expect(listRes.items.length).toBe(1);
		expect(listRes.items[0].studentName).toBe("Nguyễn Văn A");

		// Test manual enroll
		mockContext.input = { action: "enrollManual", courseId: "c1", email: "b@gmail.com" };
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const enrollRes = (await adminStudentsRoute(mockContext as any)) as {
			success: boolean;
			enrolled: boolean;
		};
		expect(enrollRes.success).toBe(true);
		expect(enrollRes.enrolled).toBe(true);
	});
});
