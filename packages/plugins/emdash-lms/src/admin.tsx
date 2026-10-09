/**
 * EmDash LMS Admin UI
 *
 * Admin pages for:
 * - LMS Setup & Schema Status (/settings/setup)
 * - Students & Enrollment Management (/students)
 * - LMS Settings (/settings)
 */

import { Button, Input, Select, Badge, Loader } from "@cloudflare/kumo";
import { Student, Gear, Wrench, CheckCircle, WarningCircle, UserPlus } from "@phosphor-icons/react";
import * as React from "react";
import { useState, useEffect } from "react";

// ============================================================================
// API Helper
// ============================================================================

async function callPluginApi<T = unknown>(route: string, body?: unknown): Promise<T> {
	const response = await fetch(`/_emdash/api/plugins/lms/${route}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-EmDash-Request": "1",
		},
		body: body ? JSON.stringify(body) : JSON.stringify({}),
	});

	if (!response.ok) {
		const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
		throw new Error(err.error?.message || `API error: ${response.status}`);
	}

	const json = await response.json();
	return json.data as T;
}

// ============================================================================
// Setup Page (/settings/setup)
// ============================================================================

export function SetupPage() {
	const [running, setRunning] = useState(false);
	const [result, setResult] = useState<{
		success: boolean;
		orphanedTablesRegistered: string[];
		collectionsCreated: string[];
		fieldsAdded: string[];
		fieldsUpdated: string[];
		totalCollections: number;
	} | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function handleRunSetup() {
		setRunning(true);
		setError(null);
		try {
			const res = await callPluginApi<{
				success: boolean;
				orphanedTablesRegistered: string[];
				collectionsCreated: string[];
				fieldsAdded: string[];
				fieldsUpdated: string[];
				totalCollections: number;
			}>("setup/run");
			setResult(res);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Đồng bộ schema thất bại");
		} finally {
			setRunning(false);
		}
	}

	return (
		<div className="p-6 max-w-4xl">
			<div className="flex items-center gap-3 mb-6">
				<Wrench className="w-6 h-6 text-kumo-brand" />
				<div>
					<h1 className="text-xl font-semibold">Cài đặt LMS & Đồng bộ Schema</h1>
					<p className="text-sm text-kumo-subtle">
						Đồng bộ 16 collection LMS, đăng ký các bảng mồ côi và chuẩn hóa trường dữ liệu
					</p>
				</div>
			</div>

			<div className="bg-kumo-surface rounded-lg border border-kumo-line p-6 mb-6">
				<h2 className="font-medium text-base mb-2">Đồng bộ cơ sở dữ liệu</h2>
				<p className="text-sm text-kumo-subtle mb-4">
					Quá trình này kiểm tra cấu trúc bảng trong D1, đăng ký các bảng `ec_*` chưa có trong
					`_emdash_collections`, bổ sung các trường còn thiếu và bảo toàn 100% dữ liệu hiện có mà
					không làm mất khóa học hay bài học.
				</p>

				<Button
					variant="primary"
					onClick={handleRunSetup}
					disabled={running}
					className="flex items-center gap-2"
				>
					{running && <Loader className="w-4 h-4 animate-spin" />}
					{running ? "Đang đồng bộ..." : "Chạy Setup / Đồng bộ Schema"}
				</Button>

				{error && (
					<div className="mt-4 p-4 rounded-md bg-kumo-danger/10 border border-kumo-danger text-kumo-danger flex items-center gap-2 text-sm">
						<WarningCircle className="w-5 h-5 flex-shrink-0" />
						<span>{error}</span>
					</div>
				)}

				{result && (
					<div className="mt-4 p-4 rounded-md bg-kumo-success/10 border border-kumo-success text-kumo-success text-sm space-y-2">
						<div className="flex items-center gap-2 font-medium">
							<CheckCircle className="w-5 h-5" />
							<span>Đồng bộ Schema thành công! (16/16 Collections sẵn sàng)</span>
						</div>
						<ul className="list-disc ps-5 space-y-1 text-kumo-body text-xs">
							<li>Bảng mồ côi đã đăng ký: {result.orphanedTablesRegistered.length || "0"}</li>
							<li>Collection mới đã tạo: {result.collectionsCreated.length || "0"}</li>
							<li>Trường mới đã bổ sung: {result.fieldsAdded.length || "0"}</li>
							<li>Trường đã chuẩn hóa lựa chọn: {result.fieldsUpdated.length || "0"}</li>
						</ul>
					</div>
				)}
			</div>
		</div>
	);
}

// ============================================================================
// Students Page (/students)
// ============================================================================

interface StudentEnrollment {
	id: string;
	user_id: string;
	course_id: string;
	progress?: number;
	started_at?: string;
	completed_at?: string;
	studentName?: string;
	studentEmail?: string;
}

interface CourseOption {
	id: string;
	title: string;
	slug: string;
}

export function StudentsPage() {
	const [courses, setCourses] = useState<CourseOption[]>([]);
	const [selectedCourse, setSelectedCourse] = useState<string>("");
	const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
	const [loading, setLoading] = useState(true);

	// Manual enrollment form
	const [email, setEmail] = useState("");
	const [enrolling, setEnrolling] = useState(false);
	const [msg, setMsg] = useState<string | null>(null);

	useEffect(() => {
		async function loadCourses() {
			try {
				const res = await callPluginApi<{ items: CourseOption[] }>("admin/students", {
					action: "listCourses",
				});
				setCourses(res.items || []);
			} catch {
				// Ignore
			}
		}
		loadCourses();
	}, []);

	async function loadEnrollments(courseId?: string) {
		setLoading(true);
		try {
			const res = await callPluginApi<{ items: StudentEnrollment[] }>("admin/students", {
				action: "list",
				courseId: courseId || undefined,
			});
			setEnrollments(res.items || []);
		} catch {
			setEnrollments([]);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		loadEnrollments(selectedCourse);
	}, [selectedCourse]);

	async function handleManualEnroll(e: React.FormEvent) {
		e.preventDefault();
		if (!email || !selectedCourse) {
			setMsg("Vui lòng nhập email và chọn khóa học");
			return;
		}

		setEnrolling(true);
		setMsg(null);
		try {
			await callPluginApi("admin/students", {
				action: "enrollManual",
				email,
				courseId: selectedCourse,
			});
			setMsg(`Đã ghi danh thành công cho học viên ${email}`);
			setEmail("");
			loadEnrollments(selectedCourse);
		} catch (err) {
			setMsg(err instanceof Error ? err.message : "Ghi danh thất bại");
		} finally {
			setEnrolling(false);
		}
	}

	return (
		<div className="p-6 max-w-5xl">
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<Student className="w-6 h-6 text-kumo-brand" />
					<div>
						<h1 className="text-xl font-semibold">Quản lý Học viên</h1>
						<p className="text-sm text-kumo-subtle">
							Theo dõi tiến độ học tập và ghi danh học viên vào các khóa cờ vua
						</p>
					</div>
				</div>
			</div>

			{/* Filter & Manual Enroll Bar */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				<div className="bg-kumo-surface p-4 rounded-lg border border-kumo-line md:col-span-1">
					<Select
						label="Lọc theo Khóa học"
						value={selectedCourse}
						onValueChange={(v) => setSelectedCourse(v ?? "")}
						items={[
							{ value: "", label: "Tất cả các khóa" },
							...courses.map((c) => ({ value: c.id, label: c.title })),
						]}
					/>
				</div>

				<form
					onSubmit={handleManualEnroll}
					className="bg-kumo-surface p-4 rounded-lg border border-kumo-line md:col-span-2 flex flex-col md:flex-row gap-3 items-end"
				>
					<div className="flex-1 w-full">
						<label className="block text-xs font-medium text-kumo-subtle mb-1">
							Ghi danh thủ công bằng Email
						</label>
						<Input
							type="email"
							placeholder="học-viên@gmail.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full"
						/>
					</div>
					<Button
						type="submit"
						variant="primary"
						disabled={enrolling || !selectedCourse || !email}
						className="flex items-center gap-2 whitespace-nowrap"
					>
						<UserPlus className="w-4 h-4" />
						{enrolling ? "Đang xử lý..." : "Ghi danh"}
					</Button>
				</form>
			</div>

			{msg && (
				<div className="mb-4 p-3 rounded-md bg-kumo-brand/10 border border-kumo-brand text-kumo-brand text-sm">
					{msg}
				</div>
			)}

			{/* Enrollments Table */}
			<div className="bg-kumo-surface rounded-lg border border-kumo-line overflow-hidden">
				{loading ? (
					<div className="p-8 text-center text-kumo-subtle">Đang tải danh sách học viên...</div>
				) : enrollments.length === 0 ? (
					<div className="p-8 text-center text-kumo-subtle">Chưa có học viên nào ghi danh.</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-start text-sm">
							<thead className="bg-kumo-surface-subtle border-b border-kumo-line text-xs font-medium text-kumo-subtle">
								<tr>
									<th className="p-3 text-start">Học viên</th>
									<th className="p-3 text-start">Email</th>
									<th className="p-3 text-start">Khóa học</th>
									<th className="p-3 text-start">Tiến độ</th>
									<th className="p-3 text-start">Bắt đầu</th>
									<th className="p-3 text-start">Hoàn thành</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-kumo-line">
								{enrollments.map((enr) => {
									const course = courses.find((c) => c.id === enr.course_id);
									return (
										<tr key={enr.id} className="hover:bg-kumo-surface-subtle/50">
											<td className="p-3 font-medium">{enr.studentName || enr.user_id}</td>
											<td className="p-3 text-kumo-subtle">{enr.studentEmail || "N/A"}</td>
											<td className="p-3">{course?.title || enr.course_id}</td>
											<td className="p-3">
												<div className="flex items-center gap-2">
													<div className="w-20 bg-kumo-surface-subtle rounded-full h-2 overflow-hidden">
														<div
															className="bg-kumo-brand h-2 rounded-full"
															style={{ width: `${enr.progress ?? 0}%` }}
														/>
													</div>
													<span className="text-xs font-mono">{enr.progress ?? 0}%</span>
												</div>
											</td>
											<td className="p-3 text-xs text-kumo-subtle">
												{enr.started_at
													? new Date(enr.started_at).toLocaleDateString("vi-VN")
													: "—"}
											</td>
											<td className="p-3 text-xs">
												{enr.completed_at ? (
													<Badge variant="success">
														{new Date(enr.completed_at).toLocaleDateString("vi-VN")}
													</Badge>
												) : (
													<span className="text-kumo-subtle">Đang học</span>
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}

// ============================================================================
// Settings Page (/settings)
// ============================================================================

export function SettingsPage() {
	return (
		<div className="p-6 max-w-4xl">
			<div className="flex items-center gap-3 mb-6">
				<Gear className="w-6 h-6 text-kumo-brand" />
				<div>
					<h1 className="text-xl font-semibold">Cài đặt Cờ Vua Học Đường LMS</h1>
					<p className="text-sm text-kumo-subtle">Cấu hình chung hệ thống học tập</p>
				</div>
			</div>

			<section className="bg-kumo-surface rounded-lg border border-kumo-line p-6 mb-6">
				<h2 className="font-medium text-base mb-4">Cấu hình chung</h2>
				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-kumo-subtle mb-1">
							Chế độ vận hành
						</label>
						<Select defaultValue="full" className="w-full">
							<option value="full">Toàn diện (Thẻ thư viện + Khóa học cờ)</option>
							<option value="membership">Chỉ Thẻ thư viện</option>
							<option value="lms">Chỉ Khóa học</option>
						</Select>
					</div>
					<div>
						<label className="block text-sm font-medium text-kumo-subtle mb-1">
							Đơn vị tiền tệ
						</label>
						<Select defaultValue="VND" className="w-full">
							<option value="VND">VND — Đồng Việt Nam</option>
							<option value="USD">USD — Đô la Mỹ</option>
						</Select>
					</div>
				</div>
			</section>
		</div>
	);
}

// ============================================================================
// Plugin Admin Exports (Named export `pages` for EmDash virtual module import)
// ============================================================================

export const pages = {
	"/settings/setup": SetupPage,
	"/students": StudentsPage,
	"/settings": SettingsPage,
};

export default {
	pages,
};
