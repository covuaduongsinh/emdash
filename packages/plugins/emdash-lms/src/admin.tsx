/**
 * EmDash LMS Admin UI
 *
 * Admin pages for:
 * - LMS Setup & Schema Status (/settings/setup)
 * - Students & Enrollment Management (/students)
 * - Orders & VietQR Manual Confirmation (/orders)
 * - Membership Plans (/plans)
 * - Members & Subscriptions (/members)
 * - Payment Gateway & SePay Settings (/settings/payment)
 * - LMS General Settings (/settings)
 */

import { Badge, Button, Input, Loader, Select } from "@cloudflare/kumo";
import { MoveRecorder, PositionEditor, PuzzlePlayer } from "@duongsinh/chess-kit/react";
import {
	ArrowDown,
	ArrowLeft,
	ArrowUp,
	Bank,
	CheckCircle,
	ClipboardText,
	CreditCard,
	Gear,
	PencilSimple,
	Plus,
	Receipt,
	Student,
	Trash,
	UserCheck,
	UserPlus,
	WarningCircle,
	Wrench,
	X,
} from "@phosphor-icons/react";
import * as React from "react";
import { useEffect, useState } from "react";

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
// Orders Page (/orders)
// ============================================================================

interface OrderItem {
	id: string;
	user_id: string;
	type: "membership" | "course";
	item_id: string;
	amount: number;
	currency: string;
	status: "pending" | "completed" | "cancelled" | "expired";
	payment_provider?: string;
	created_at?: string;
	metadata?: {
		order_code?: string;
		item_name?: string;
		expires_at?: string;
		manual_confirmed_by?: string;
		manual_confirm_reason?: string;
		paid_at?: string;
		transfer_amount?: number;
	};
}

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("vi-VN", {
		style: "currency",
		currency: "VND",
		minimumFractionDigits: 0,
	}).format(amount);
}

export function OrdersPage() {
	const [orders, setOrders] = useState<OrderItem[]>([]);
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [loading, setLoading] = useState(true);

	// Manual confirm modal state
	const [confirmingOrder, setConfirmingOrder] = useState<OrderItem | null>(null);
	const [confirmReason, setConfirmReason] = useState("");
	const [submittingConfirm, setSubmittingConfirm] = useState(false);
	const [confirmError, setConfirmError] = useState<string | null>(null);

	async function loadOrders(status?: string) {
		setLoading(true);
		try {
			const res = await callPluginApi<{ items: OrderItem[] }>("admin/orders/list", {
				status: status && status !== "all" ? status : undefined,
			});
			setOrders(res.items || []);
		} catch {
			setOrders([]);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		loadOrders(statusFilter);
	}, [statusFilter]);

	async function handleConfirmOrder() {
		if (!confirmingOrder || !confirmReason.trim()) {
			setConfirmError("Vui lòng nhập lý do xác nhận");
			return;
		}

		setSubmittingConfirm(true);
		setConfirmError(null);
		try {
			await callPluginApi("admin/orders/confirm", {
				orderId: confirmingOrder.id,
				reason: confirmReason.trim(),
			});
			setConfirmingOrder(null);
			setConfirmReason("");
			loadOrders(statusFilter);
		} catch (err) {
			setConfirmError(err instanceof Error ? err.message : "Xác nhận thất bại");
		} finally {
			setSubmittingConfirm(false);
		}
	}

	return (
		<div className="p-6 max-w-6xl">
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<Receipt className="w-6 h-6 text-kumo-brand" />
					<div>
						<h1 className="text-xl font-semibold">Quản lý Đơn hàng VietQR</h1>
						<p className="text-sm text-kumo-subtle">
							Theo dõi giao dịch chuyển khoản SePay và hỗ trợ kích hoạt thủ công khi cần
						</p>
					</div>
				</div>
			</div>

			{/* Filters */}
			<div className="flex gap-2 mb-6">
				{[
					{ key: "all", label: "Tất cả" },
					{ key: "pending", label: "Chờ thanh toán" },
					{ key: "completed", label: "Đã hoàn thành" },
					{ key: "expired", label: "Đã hết hạn" },
				].map((tab) => (
					<Button
						key={tab.key}
						variant={statusFilter === tab.key ? "primary" : "secondary"}
						onClick={() => setStatusFilter(tab.key)}
						className="text-xs"
					>
						{tab.label}
					</Button>
				))}
			</div>

			{/* Orders Table */}
			<div className="bg-kumo-surface rounded-lg border border-kumo-line overflow-hidden">
				{loading ? (
					<div className="p-8 text-center text-kumo-subtle">Đang tải danh sách đơn hàng...</div>
				) : orders.length === 0 ? (
					<div className="p-8 text-center text-kumo-subtle">Không tìm thấy đơn hàng nào.</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-start text-sm">
							<thead className="bg-kumo-surface-subtle border-b border-kumo-line text-xs font-medium text-kumo-subtle">
								<tr>
									<th className="p-3 text-start">Mã đối soát</th>
									<th className="p-3 text-start">Học viên</th>
									<th className="p-3 text-start">Học liệu</th>
									<th className="p-3 text-start">Số tiền</th>
									<th className="p-3 text-start">Trạng thái</th>
									<th className="p-3 text-start">Thời gian</th>
									<th className="p-3 text-end">Thao tác</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-kumo-line">
								{orders.map((order) => {
									const orderCode = order.metadata?.order_code || order.id;
									return (
										<tr key={order.id} className="hover:bg-kumo-surface-subtle/50">
											<td className="p-3 font-mono font-medium text-kumo-brand">{orderCode}</td>
											<td className="p-3 text-kumo-subtle text-xs">{order.user_id}</td>
											<td className="p-3">
												<span className="font-medium text-xs">
													{order.metadata?.item_name ||
														(order.type === "membership" ? "Thẻ thư viện" : "Khóa học")}
												</span>
											</td>
											<td className="p-3 font-semibold text-sm">{formatCurrency(order.amount)}</td>
											<td className="p-3 text-xs">
												{order.status === "completed" ? (
													<Badge variant="success">Hoàn thành</Badge>
												) : order.status === "pending" ? (
													<Badge variant="warning">Chờ chuyển khoản</Badge>
												) : (
													<Badge variant="neutral">{order.status}</Badge>
												)}
											</td>
											<td className="p-3 text-xs text-kumo-subtle">
												{order.created_at
													? new Date(order.created_at).toLocaleString("vi-VN")
													: "—"}
											</td>
											<td className="p-3 text-end">
												{order.status === "pending" && (
													<Button
														variant="secondary"
														onClick={() => {
															setConfirmingOrder(order);
															setConfirmReason("");
															setConfirmError(null);
														}}
														className="text-xs"
													>
														Xác nhận tay
													</Button>
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

			{/* Manual Confirm Modal */}
			{confirmingOrder && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
					<div className="bg-kumo-surface rounded-xl border border-kumo-line max-w-md w-full p-6 shadow-xl">
						<h3 className="font-semibold text-base mb-2">Xác nhận đơn hàng thủ công</h3>
						<p className="text-xs text-kumo-subtle mb-4">
							Dành cho trường hợp học viên đã chuyển khoản nhưng sai cú pháp nội dung. Hệ thống sẽ
							kích hoạt ngay Thẻ thư viện / Khóa học cho học viên.
						</p>

						<div className="bg-kumo-surface-subtle p-3 rounded-lg text-xs space-y-1 mb-4 border border-kumo-line">
							<div>
								<strong>Mã đơn:</strong>{" "}
								{confirmingOrder.metadata?.order_code || confirmingOrder.id}
							</div>
							<div>
								<strong>Số tiền:</strong> {formatCurrency(confirmingOrder.amount)}
							</div>
							<div>
								<strong>Học viên ID:</strong> {confirmingOrder.user_id}
							</div>
						</div>

						<div className="mb-4">
							<label className="block text-xs font-medium text-kumo-subtle mb-1">
								Lý do xác nhận (bắt buộc lưu vết kiểm toán)
							</label>
							<Input
								type="text"
								placeholder="VD: Khách gửi nhầm mã CK, đã đối soát sao kê ngân hàng"
								value={confirmReason}
								onChange={(e) => setConfirmReason(e.target.value)}
								className="w-full"
							/>
						</div>

						{confirmError && (
							<div className="mb-4 p-2 rounded bg-kumo-danger/10 text-kumo-danger text-xs">
								{confirmError}
							</div>
						)}

						<div className="flex justify-end gap-2">
							<Button
								variant="secondary"
								onClick={() => setConfirmingOrder(null)}
								disabled={submittingConfirm}
							>
								Hủy
							</Button>
							<Button
								variant="primary"
								onClick={handleConfirmOrder}
								disabled={submittingConfirm || !confirmReason.trim()}
							>
								{submittingConfirm ? "Đang xử lý..." : "Xác nhận & Kích hoạt"}
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

// ============================================================================
// Plans Page (/plans)
// ============================================================================

interface PlanItem {
	id: string;
	name: string;
	price: number;
	billing_period?: string;
	description?: string;
	status?: string;
}

export function PlansPage() {
	const [plans, setPlans] = useState<PlanItem[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function loadPlans() {
			try {
				const res = await callPluginApi<{ items: PlanItem[] }>("plans", { action: "list" });
				setPlans(res.items || []);
			} catch {
				setPlans([]);
			} finally {
				setLoading(false);
			}
		}
		loadPlans();
	}, []);

	return (
		<div className="p-6 max-w-5xl">
			<div className="flex items-center gap-3 mb-6">
				<CreditCard className="w-6 h-6 text-kumo-brand" />
				<div>
					<h1 className="text-xl font-semibold">Gói Thẻ Thư Viện</h1>
					<p className="text-sm text-kumo-subtle">
						Danh sách các gói thẻ thư viện học liệu cờ vua học đường
					</p>
				</div>
			</div>

			<div className="bg-kumo-surface rounded-lg border border-kumo-line overflow-hidden">
				{loading ? (
					<div className="p-8 text-center text-kumo-subtle">Đang tải danh sách gói...</div>
				) : plans.length === 0 ? (
					<div className="p-8 text-center text-kumo-subtle">Chưa có gói thẻ thư viện nào.</div>
				) : (
					<table className="w-full text-start text-sm">
						<thead className="bg-kumo-surface-subtle border-b border-kumo-line text-xs font-medium text-kumo-subtle">
							<tr>
								<th className="p-3 text-start">Tên gói</th>
								<th className="p-3 text-start">Thời hạn</th>
								<th className="p-3 text-start">Giá</th>
								<th className="p-3 text-start">Trạng thái</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-kumo-line">
							{plans.map((plan) => (
								<tr key={plan.id} className="hover:bg-kumo-surface-subtle/50">
									<td className="p-3 font-medium">{plan.name}</td>
									<td className="p-3 text-kumo-subtle capitalize">
										{plan.billing_period || "Vĩnh viễn"}
									</td>
									<td className="p-3 font-semibold">
										{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
											plan.price || 0,
										)}
									</td>
									<td className="p-3">
										<Badge variant="success">Hoạt động</Badge>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}

// ============================================================================
// Members Page (/members)
// ============================================================================

interface MemberItem {
	id: string;
	user_id: string;
	plan_id: string;
	status: string;
	started_at?: string;
	expires_at?: string;
}

export function MembersPage() {
	const [members, setMembers] = useState<MemberItem[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function loadMembers() {
			try {
				const res = await callPluginApi<{ items: MemberItem[] }>("members", { action: "list" });
				setMembers(res.items || []);
			} catch {
				setMembers([]);
			} finally {
				setLoading(false);
			}
		}
		loadMembers();
	}, []);

	return (
		<div className="p-6 max-w-5xl">
			<div className="flex items-center gap-3 mb-6">
				<UserCheck className="w-6 h-6 text-kumo-brand" />
				<div>
					<h1 className="text-xl font-semibold">Hội viên & Thẻ Đang Hoạt Động</h1>
					<p className="text-sm text-kumo-subtle">
						Danh sách học viên đang sở hữu Thẻ thư viện học liệu cờ vua
					</p>
				</div>
			</div>

			<div className="bg-kumo-surface rounded-lg border border-kumo-line overflow-hidden">
				{loading ? (
					<div className="p-8 text-center text-kumo-subtle">Đang tải danh sách hội viên...</div>
				) : members.length === 0 ? (
					<div className="p-8 text-center text-kumo-subtle">Chưa có hội viên nào.</div>
				) : (
					<table className="w-full text-start text-sm">
						<thead className="bg-kumo-surface-subtle border-b border-kumo-line text-xs font-medium text-kumo-subtle">
							<tr>
								<th className="p-3 text-start">Học viên ID</th>
								<th className="p-3 text-start">Mã gói</th>
								<th className="p-3 text-start">Ngày kích hoạt</th>
								<th className="p-3 text-start">Ngày hết hạn</th>
								<th className="p-3 text-start">Trạng thái</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-kumo-line">
							{members.map((m) => (
								<tr key={m.id} className="hover:bg-kumo-surface-subtle/50">
									<td className="p-3 font-mono text-xs">{m.user_id}</td>
									<td className="p-3 text-xs">{m.plan_id}</td>
									<td className="p-3 text-xs text-kumo-subtle">
										{m.started_at ? new Date(m.started_at).toLocaleDateString("vi-VN") : "—"}
									</td>
									<td className="p-3 text-xs text-kumo-subtle">
										{m.expires_at
											? new Date(m.expires_at).toLocaleDateString("vi-VN")
											: "Vĩnh viễn"}
									</td>
									<td className="p-3 text-xs">
										<Badge variant={m.status === "active" ? "success" : "neutral"}>
											{m.status === "active" ? "Đang hiệu lực" : m.status}
										</Badge>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}

// ============================================================================
// Payment Settings Page (/settings/payment)
// ============================================================================

export function PaymentSettingsPage() {
	const [bankCode, setBankCode] = useState("MB");
	const [bankAccount, setBankAccount] = useState("");
	const [accountName, setAccountName] = useState("");
	const [sepayApiKey, setSepayApiKey] = useState("");
	const [qrTemplate, setQrTemplate] = useState("compact");
	const [expiresInHours, setExpiresInHours] = useState(24);
	const [hasKey, setHasKey] = useState(false);

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [msg, setMsg] = useState<string | null>(null);

	useEffect(() => {
		async function loadSettings() {
			try {
				const res = await callPluginApi<{
					bank_code: string;
					bank_account: string;
					account_name: string;
					has_sepay_api_key: boolean;
					sepay_api_key_masked: string;
					qr_template: string;
					expires_in_hours: number;
				}>("admin/settings/payment", { action: "get" });

				setBankCode(res.bank_code || "MB");
				setBankAccount(res.bank_account || "");
				setAccountName(res.account_name || "");
				setQrTemplate(res.qr_template || "compact");
				setExpiresInHours(res.expires_in_hours || 24);
				setHasKey(res.has_sepay_api_key);
			} catch {
				// Ignore
			} finally {
				setLoading(false);
			}
		}
		loadSettings();
	}, []);

	async function handleSave(e: React.FormEvent) {
		e.preventDefault();
		setSaving(true);
		setMsg(null);
		try {
			await callPluginApi("admin/settings/payment", {
				action: "save",
				data: {
					bank_code: bankCode,
					bank_account: bankAccount,
					account_name: accountName,
					sepay_api_key: sepayApiKey || undefined,
					qr_template: qrTemplate,
					expires_in_hours: expiresInHours,
				},
			});
			setMsg("Đã lưu cấu hình thanh toán thành công!");
			setSepayApiKey("");
			setHasKey(true);
		} catch (err) {
			setMsg(err instanceof Error ? err.message : "Lưu cấu hình thất bại");
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="p-6 max-w-4xl">
			<div className="flex items-center gap-3 mb-6">
				<Bank className="w-6 h-6 text-kumo-brand" />
				<div>
					<h1 className="text-xl font-semibold">Cài đặt Thanh toán SePay VietQR</h1>
					<p className="text-sm text-kumo-subtle">
						Cấu hình tài khoản ngân hàng nhận tiền và xác thực Webhook tự động
					</p>
				</div>
			</div>

			{loading ? (
				<div className="p-8 text-center text-kumo-subtle">Đang tải cấu hình...</div>
			) : (
				<form
					onSubmit={handleSave}
					className="bg-kumo-surface rounded-lg border border-kumo-line p-6 space-y-4"
				>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-xs font-medium text-kumo-subtle mb-1">
								Mã ngân hàng (VietQR / SePay Code)
							</label>
							<Input
								type="text"
								placeholder="MB, VCB, ACB, ICB..."
								value={bankCode}
								onChange={(e) => setBankCode(e.target.value)}
								className="w-full"
							/>
						</div>

						<div>
							<label className="block text-xs font-medium text-kumo-subtle mb-1">
								Số tài khoản ngân hàng
							</label>
							<Input
								type="text"
								placeholder="0010000000355..."
								value={bankAccount}
								onChange={(e) => setBankAccount(e.target.value)}
								className="w-full font-mono"
							/>
						</div>
					</div>

					<div>
						<label className="block text-xs font-medium text-kumo-subtle mb-1">
							Tên chủ tài khoản (in hoa không dấu)
						</label>
						<Input
							type="text"
							placeholder="CTY CP CO VUA DUONG SINH"
							value={accountName}
							onChange={(e) => setAccountName(e.target.value)}
							className="w-full"
						/>
					</div>

					<div>
						<label className="block text-xs font-medium text-kumo-subtle mb-1">
							SePay Webhook API Key {hasKey && "(Đã có API Key trên hệ thống)"}
						</label>
						<Input
							type="password"
							placeholder={hasKey ? "Nhập nếu muốn đổi khóa mới" : "Nhập SePay API Key..."}
							value={sepayApiKey}
							onChange={(e) => setSepayApiKey(e.target.value)}
							className="w-full font-mono"
						/>
						<p className="text-xs text-kumo-subtle mt-1">
							Được dùng để xác thực webhook gửi đến từ SePay (`Authorization: Apikey &lt;KEY&gt;`).
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-xs font-medium text-kumo-subtle mb-1">
								Mẫu ảnh VietQR
							</label>
							<Select
								value={qrTemplate}
								onValueChange={(v) => setQrTemplate(v ?? "compact")}
								items={[
									{ value: "compact", label: "Compact (Gọn gàng)" },
									{ value: "qronly", label: "QR Only (Chỉ mã QR)" },
									{ value: "standee", label: "Standee (Đầy đủ)" },
								]}
							/>
						</div>

						<div>
							<label className="block text-xs font-medium text-kumo-subtle mb-1">
								Thời gian hết hạn đơn hàng (giờ)
							</label>
							<Input
								type="number"
								min="1"
								max="168"
								value={String(expiresInHours)}
								onChange={(e) => setExpiresInHours(Number(e.target.value))}
								className="w-full"
							/>
						</div>
					</div>

					{msg && (
						<div className="p-3 rounded-md bg-kumo-success/10 border border-kumo-success text-kumo-success text-sm">
							{msg}
						</div>
					)}

					<div className="pt-2">
						<Button type="submit" variant="primary" disabled={saving}>
							{saving ? "Đang lưu..." : "Lưu Cài Đặt Thanh Toán"}
						</Button>
					</div>
				</form>
			)}
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
						<Select
							defaultValue="full"
							items={[
								{ value: "full", label: "Toàn diện (Thẻ thư viện + Khóa học cờ)" },
								{ value: "membership", label: "Chỉ Thẻ thư viện" },
								{ value: "lms", label: "Chỉ Khóa học" },
							]}
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-kumo-subtle mb-1">
							Đơn vị tiền tệ
						</label>
						<Select
							defaultValue="VND"
							items={[
								{ value: "VND", label: "VND — Đồng Việt Nam" },
								{ value: "USD", label: "USD — Đô la Mỹ" },
							]}
						/>
					</div>
				</div>
			</section>
		</div>
	);
}

// ============================================================================
// Quizzes Page (/quizzes) - Quiz Builder with Chess Questions
// ============================================================================

interface QuizListItem {
	id: string;
	title: string;
	lesson_id: string;
	description?: string;
	passmark: number;
	timer_minutes?: number;
	allow_reset?: boolean;
	random_order?: boolean;
	status?: string;
	questionCount?: number;
}

interface QuestionItem {
	id?: string;
	quiz_id: string;
	question: string;
	type: "single" | "multiple" | "text" | "fill_blank" | "chess";
	answers: any;
	grade: number;
	sort_order: number;
	explanation?: string;
}

export function QuizzesPage() {
	const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [msg, setMsg] = useState<string | null>(null);

	// Quiz edit state
	const [editingQuiz, setEditingQuiz] = useState<Partial<QuizListItem> | null>(null);
	const [quizQuestions, setQuizQuestions] = useState<QuestionItem[]>([]);
	const [loadingQuestions, setLoadingQuestions] = useState(false);
	const [savingQuiz, setSavingQuiz] = useState(false);

	// Question modal edit state
	const [editingQuestion, setEditingQuestion] = useState<Partial<QuestionItem> | null>(null);
	const [chessTab, setChessTab] = useState<"board" | "moves" | "test">("board");
	const [puzzleOptions, setPuzzleOptions] = useState<Array<{ id: string; name: string }>>([]);
	const [fetchingPuzzles, setFetchingPuzzles] = useState(false);

	async function loadQuizzes() {
		setLoading(true);
		try {
			const res = await callPluginApi<{ items: QuizListItem[] }>("admin/quiz/list", {});
			setQuizzes(res.items || []);
		} catch {
			setQuizzes([]);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		loadQuizzes();
	}, []);

	async function handleOpenQuizEditor(quizId?: string) {
		if (!quizId) {
			setEditingQuiz({
				title: "",
				lesson_id: "",
				description: "",
				passmark: 70,
				timer_minutes: 0,
				allow_reset: true,
				random_order: false,
				status: "published",
			});
			setQuizQuestions([]);
			return;
		}

		setLoadingQuestions(true);
		try {
			const res = await callPluginApi<{ quiz: QuizListItem; questions: QuestionItem[] }>(
				"admin/quiz/get",
				{ id: quizId },
			);
			setEditingQuiz(res.quiz);
			setQuizQuestions(res.questions || []);
		} catch (err) {
			alert(err instanceof Error ? err.message : "Không thể tải chi tiết quiz");
		} finally {
			setLoadingQuestions(false);
		}
	}

	async function handleSaveQuiz(e: React.FormEvent) {
		e.preventDefault();
		if (!editingQuiz || !editingQuiz.title || !editingQuiz.lesson_id) {
			alert("Vui lòng nhập tiêu đề và ID bài học");
			return;
		}

		setSavingQuiz(true);
		try {
			await callPluginApi<QuizListItem>("admin/quiz/save", {
				id: editingQuiz.id,
				title: editingQuiz.title,
				lesson_id: editingQuiz.lesson_id,
				description: editingQuiz.description,
				passmark: Number(editingQuiz.passmark) || 70,
				timer_minutes: Number(editingQuiz.timer_minutes) || undefined,
				allow_reset: editingQuiz.allow_reset !== false,
				random_order: !!editingQuiz.random_order,
				status: (editingQuiz.status as any) || "published",
			});
			setMsg("Đã lưu Quiz thành công!");
			setEditingQuiz(null);
			loadQuizzes();
		} catch (err) {
			alert(err instanceof Error ? err.message : "Lưu quiz thất bại");
		} finally {
			setSavingQuiz(false);
		}
	}

	async function handleDeleteQuiz(id: string) {
		if (!confirm("Bạn có chắc chắn muốn xóa Quiz này cùng toàn bộ câu hỏi liên quan?")) return;
		try {
			await callPluginApi("admin/quiz/delete", { id });
			loadQuizzes();
		} catch (err) {
			alert(err instanceof Error ? err.message : "Xóa quiz thất bại");
		}
	}

	// Question Handlers
	function handleNewQuestion(type: QuestionItem["type"] = "single") {
		if (!editingQuiz?.id) {
			alert("Vui lòng lưu thông tin Quiz trước khi thêm câu hỏi");
			return;
		}

		let defaultAnswers: any = [];
		if (type === "single" || type === "multiple") {
			defaultAnswers = [
				{ id: "opt-1", text: "Phương án A", is_correct: true, sort_order: 0 },
				{ id: "opt-2", text: "Phương án B", is_correct: false, sort_order: 1 },
			];
		} else if (type === "text" || type === "fill_blank") {
			defaultAnswers = "";
		} else if (type === "chess") {
			defaultAnswers = {
				fen: "6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1",
				solution: ["a1a8"],
				orientation: "white",
				prompt: "Trắng đi và chiếu hết sau 1 nước",
			};
		}

		setEditingQuestion({
			quiz_id: editingQuiz.id,
			question: "",
			type,
			answers: defaultAnswers,
			grade: 1,
			sort_order: quizQuestions.length,
			explanation: "",
		});
		setChessTab("board");
	}

	async function handleSaveQuestion() {
		if (!editingQuestion || !editingQuestion.question || !editingQuestion.quiz_id) {
			alert("Vui lòng nhập nội dung câu hỏi");
			return;
		}

		try {
			await callPluginApi("admin/question/save", {
				id: editingQuestion.id,
				quiz_id: editingQuestion.quiz_id,
				question: editingQuestion.question,
				type: editingQuestion.type,
				answers: editingQuestion.answers,
				grade: Number(editingQuestion.grade) || 1,
				sort_order: editingQuestion.sort_order ?? 0,
				explanation: editingQuestion.explanation,
			});
			setEditingQuestion(null);
			if (editingQuiz?.id) {
				handleOpenQuizEditor(editingQuiz.id);
			}
		} catch (err) {
			alert(err instanceof Error ? err.message : "Lưu câu hỏi thất bại");
		}
	}

	async function handleDeleteQuestion(id: string) {
		if (!confirm("Bạn có chắc muốn xóa câu hỏi này?")) return;
		try {
			await callPluginApi("admin/question/delete", { id });
			if (editingQuiz?.id) {
				handleOpenQuizEditor(editingQuiz.id);
			}
		} catch (err) {
			alert(err instanceof Error ? err.message : "Xóa câu hỏi thất bại");
		}
	}

	async function handleMoveQuestion(idx: number, direction: "up" | "down") {
		const targetIdx = direction === "up" ? idx - 1 : idx + 1;
		if (targetIdx < 0 || targetIdx >= quizQuestions.length) return;

		const next = [...quizQuestions];
		const temp = next[idx];
		next[idx] = next[targetIdx];
		next[targetIdx] = temp;

		setQuizQuestions(next);
		const ids = next.map((q) => q.id!).filter(Boolean);
		try {
			await callPluginApi("admin/question/reorder", { questionIds: ids });
		} catch {
			// ignore
		}
	}

	async function handleFetchPuzzleOptions() {
		setFetchingPuzzles(true);
		try {
			const res = await fetch("/_emdash/api/plugins/chess-puzzles/puzzles/options", {
				method: "POST",
				headers: { "Content-Type": "application/json", "X-EmDash-Request": "1" },
				body: JSON.stringify({}),
			});
			if (res.ok) {
				const json = await res.json();
				setPuzzleOptions(json.data?.items || []);
			} else {
				alert("Plugin chess-puzzles chưa được bật trên hệ thống.");
			}
		} catch {
			alert("Chưa kết nối được với kho câu đố chess-puzzles.");
		} finally {
			setFetchingPuzzles(false);
		}
	}

	return (
		<div className="p-6 max-w-6xl">
			{/* Top Header */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<ClipboardText className="w-6 h-6 text-kumo-brand" />
					<div>
						<h1 className="text-xl font-semibold">Soạn Quiz & Bài tập Cờ vua</h1>
						<p className="text-sm text-kumo-subtle">
							Quản lý các bài trắc nghiệm, câu hỏi tự luận và bài tập cờ vua tương tác
						</p>
					</div>
				</div>

				{!editingQuiz && (
					<Button
						variant="primary"
						onClick={() => handleOpenQuizEditor()}
						className="flex items-center gap-2"
					>
						<Plus className="w-4 h-4" />
						Soạn Quiz Mới
					</Button>
				)}
			</div>

			{msg && (
				<div className="mb-4 p-3 rounded-md bg-kumo-success/10 border border-kumo-success text-kumo-success text-sm">
					{msg}
				</div>
			)}

			{/* 1. Quiz List View */}
			{!editingQuiz ? (
				<div className="bg-kumo-surface rounded-lg border border-kumo-line overflow-hidden">
					{loading ? (
						<div className="p-8 text-center text-kumo-subtle">Đang tải danh sách Quiz...</div>
					) : quizzes.length === 0 ? (
						<div className="p-8 text-center text-kumo-subtle">
							Chưa có bài kiểm tra nào. Bấm "Soạn Quiz Mới" để bắt đầu.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-start text-sm">
								<thead className="bg-kumo-surface-subtle border-b border-kumo-line text-xs font-medium text-kumo-subtle">
									<tr>
										<th className="p-3 text-start">Tiêu đề Quiz</th>
										<th className="p-3 text-start">Mã bài học</th>
										<th className="p-3 text-start">Điểm đạt</th>
										<th className="p-3 text-start">Thời gian</th>
										<th className="p-3 text-start">Số câu hỏi</th>
										<th className="p-3 text-end">Thao tác</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-kumo-line">
									{quizzes.map((q) => (
										<tr key={q.id} className="hover:bg-kumo-surface-subtle/50">
											<td className="p-3 font-semibold text-kumo-brand">{q.title}</td>
											<td className="p-3 font-mono text-xs text-kumo-subtle">{q.lesson_id}</td>
											<td className="p-3">
												<Badge variant="success">{q.passmark}%</Badge>
											</td>
											<td className="p-3 text-xs">
												{q.timer_minutes ? `${q.timer_minutes} phút` : "Không giới hạn"}
											</td>
											<td className="p-3 text-xs font-medium">{q.questionCount || 0} câu</td>
											<td className="p-3 text-end space-x-2">
												<Button
													variant="secondary"
													onClick={() => handleOpenQuizEditor(q.id)}
													className="text-xs"
												>
													<PencilSimple className="w-3.5 h-3.5 me-1" />
													Soạn câu hỏi
												</Button>
												<Button
													variant="destructive"
													onClick={() => handleDeleteQuiz(q.id)}
													className="text-xs"
												>
													<Trash className="w-3.5 h-3.5" />
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			) : (
				/* 2. Quiz Editor View */
				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<Button
							variant="secondary"
							onClick={() => setEditingQuiz(null)}
							className="flex items-center gap-1 text-xs"
						>
							<ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh sách
						</Button>
						<span className="text-xs text-kumo-subtle font-mono">
							ID: {editingQuiz.id || "Mới"}
						</span>
					</div>

					{/* Quiz Settings Form */}
					<form
						onSubmit={handleSaveQuiz}
						className="bg-kumo-surface p-6 rounded-lg border border-kumo-line space-y-4"
					>
						<h2 className="font-semibold text-base">Thông tin chung bài kiểm tra</h2>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-xs font-medium text-kumo-subtle mb-1">
									Tiêu đề Quiz <span className="text-kumo-danger">*</span>
								</label>
								<Input
									type="text"
									placeholder="VD: Kiểm tra Khai cuộc cơ bản"
									value={editingQuiz.title || ""}
									onChange={(e) => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
									className="w-full"
								/>
							</div>

							<div>
								<label className="block text-xs font-medium text-kumo-subtle mb-1">
									Mã Bài học đính kèm (Lesson ID / Slug) <span className="text-kumo-danger">*</span>
								</label>
								<Input
									type="text"
									placeholder="VD: les_01, khai-cuoc-can-ban..."
									value={editingQuiz.lesson_id || ""}
									onChange={(e) => setEditingQuiz({ ...editingQuiz, lesson_id: e.target.value })}
									className="w-full font-mono"
								/>
							</div>
						</div>

						<div>
							<label className="block text-xs font-medium text-kumo-subtle mb-1">
								Mô tả / Hướng dẫn làm bài
							</label>
							<Input
								type="text"
								placeholder="VD: Hãy hoàn thành các câu trắc nghiệm và giải thế cờ bên dưới."
								value={editingQuiz.description || ""}
								onChange={(e) => setEditingQuiz({ ...editingQuiz, description: e.target.value })}
								className="w-full"
							/>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div>
								<label className="block text-xs font-medium text-kumo-subtle mb-1">
									Điểm đạt (%)
								</label>
								<Input
									type="number"
									min="0"
									max="100"
									value={String(editingQuiz.passmark ?? 70)}
									onChange={(e) =>
										setEditingQuiz({ ...editingQuiz, passmark: Number(e.target.value) })
									}
									className="w-full"
								/>
							</div>

							<div>
								<label className="block text-xs font-medium text-kumo-subtle mb-1">
									Thời gian làm bài (phút, 0 = không giới hạn)
								</label>
								<Input
									type="number"
									min="0"
									value={String(editingQuiz.timer_minutes ?? 0)}
									onChange={(e) =>
										setEditingQuiz({ ...editingQuiz, timer_minutes: Number(e.target.value) })
									}
									className="w-full"
								/>
							</div>

							<div className="flex items-center gap-4 pt-4">
								<label className="flex items-center gap-2 text-xs cursor-pointer">
									<input
										type="checkbox"
										checked={editingQuiz.allow_reset !== false}
										onChange={(e) =>
											setEditingQuiz({ ...editingQuiz, allow_reset: e.target.checked })
										}
									/>
									Cho phép làm lại
								</label>

								<label className="flex items-center gap-2 text-xs cursor-pointer">
									<input
										type="checkbox"
										checked={!!editingQuiz.random_order}
										onChange={(e) =>
											setEditingQuiz({ ...editingQuiz, random_order: e.target.checked })
										}
									/>
									Xáo trộn câu hỏi
								</label>
							</div>
						</div>

						<div className="pt-2 flex justify-end">
							<Button type="submit" variant="primary" disabled={savingQuiz}>
								{savingQuiz ? "Đang lưu..." : "Lưu Thông Tin Quiz"}
							</Button>
						</div>
					</form>

					{/* Questions Section */}
					{editingQuiz.id && (
						<div className="bg-kumo-surface p-6 rounded-lg border border-kumo-line space-y-4">
							<div className="flex items-center justify-between">
								<h2 className="font-semibold text-base">
									Danh sách câu hỏi ({quizQuestions.length})
								</h2>

								<div className="flex gap-2">
									<Button
										variant="secondary"
										onClick={() => handleNewQuestion("single")}
										className="text-xs"
									>
										+ Trắc nghiệm đơn
									</Button>
									<Button
										variant="secondary"
										onClick={() => handleNewQuestion("multiple")}
										className="text-xs"
									>
										+ Nhiều đáp án
									</Button>
									<Button
										variant="secondary"
										onClick={() => handleNewQuestion("text")}
										className="text-xs"
									>
										+ Điền từ
									</Button>
									<Button
										variant="primary"
										onClick={() => handleNewQuestion("chess")}
										className="text-xs"
									>
										+ Câu cờ vua
									</Button>
								</div>
							</div>

							{loadingQuestions ? (
								<div className="p-4 text-center text-kumo-subtle text-xs">Đang tải câu hỏi...</div>
							) : quizQuestions.length === 0 ? (
								<div className="p-6 text-center text-kumo-subtle text-xs border border-dashed border-kumo-line rounded-md">
									Chưa có câu hỏi nào. Hãy chọn một loại câu hỏi ở trên để thêm.
								</div>
							) : (
								<div className="divide-y divide-kumo-line">
									{quizQuestions.map((q, idx) => (
										<div key={q.id || idx} className="py-3 flex items-center justify-between gap-4">
											<div className="flex items-center gap-3">
												<div className="flex flex-col gap-0.5">
													<button
														type="button"
														disabled={idx === 0}
														onClick={() => handleMoveQuestion(idx, "up")}
														className="text-kumo-subtle hover:text-kumo-brand disabled:opacity-30"
													>
														<ArrowUp className="w-3.5 h-3.5" />
													</button>
													<button
														type="button"
														disabled={idx === quizQuestions.length - 1}
														onClick={() => handleMoveQuestion(idx, "down")}
														className="text-kumo-subtle hover:text-kumo-brand disabled:opacity-30"
													>
														<ArrowDown className="w-3.5 h-3.5" />
													</button>
												</div>

												<Badge
													variant={q.type === "chess" ? "success" : "neutral"}
													className="text-xs"
												>
													{q.type === "chess"
														? "♟ Cờ vua"
														: q.type === "single"
															? "Trắc nghiệm"
															: q.type === "multiple"
																? "Nhiều đáp án"
																: "Điền từ"}
												</Badge>

												<div>
													<div className="font-medium text-sm">
														{q.question || "(Chưa có nội dung)"}
													</div>
													<div className="text-xs text-kumo-subtle">Điểm: {q.grade}</div>
												</div>
											</div>

											<div className="flex items-center gap-2">
												<Button
													variant="secondary"
													onClick={() => setEditingQuestion(q)}
													className="text-xs"
												>
													Sửa
												</Button>
												<Button
													variant="destructive"
													onClick={() => q.id && handleDeleteQuestion(q.id)}
													className="text-xs"
												>
													<Trash className="w-3.5 h-3.5" />
												</Button>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{/* Question Editor Modal */}
					{editingQuestion && (
						<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
							<div className="bg-kumo-surface rounded-xl border border-kumo-line max-w-2xl w-full p-6 shadow-2xl my-8 space-y-4">
								<div className="flex items-center justify-between border-b border-kumo-line pb-3">
									<h3 className="font-semibold text-base">
										{editingQuestion.id ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới"} (
										{editingQuestion.type})
									</h3>
									<button
										type="button"
										onClick={() => setEditingQuestion(null)}
										className="text-kumo-subtle hover:text-kumo-body"
									>
										<X className="w-5 h-5" />
									</button>
								</div>

								{/* Question Text */}
								<div>
									<label className="block text-xs font-medium text-kumo-subtle mb-1">
										Nội dung câu hỏi
									</label>
									<Input
										type="text"
										placeholder="VD: Trắng đi và chiếu hết sau 1 nước..."
										value={editingQuestion.question || ""}
										onChange={(e) =>
											setEditingQuestion({ ...editingQuestion, question: e.target.value })
										}
										className="w-full"
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-xs font-medium text-kumo-subtle mb-1">
											Điểm số
										</label>
										<Input
											type="number"
											min="1"
											value={String(editingQuestion.grade ?? 1)}
											onChange={(e) =>
												setEditingQuestion({ ...editingQuestion, grade: Number(e.target.value) })
											}
											className="w-full"
										/>
									</div>
									<div>
										<label className="block text-xs font-medium text-kumo-subtle mb-1">
											Giải thích đáp án
										</label>
										<Input
											type="text"
											placeholder="VD: Xe a1 lên a8 chiếu hết..."
											value={editingQuestion.explanation || ""}
											onChange={(e) =>
												setEditingQuestion({ ...editingQuestion, explanation: e.target.value })
											}
											className="w-full"
										/>
									</div>
								</div>

								{/* Choice Editor for Single / Multiple */}
								{(editingQuestion.type === "single" || editingQuestion.type === "multiple") && (
									<div className="space-y-3 pt-2">
										<div className="flex items-center justify-between">
											<label className="block text-xs font-medium text-kumo-subtle">
												Các phương án trả lời
											</label>
											<Button
												variant="secondary"
												className="text-xs"
												onClick={() => {
													const current = Array.isArray(editingQuestion.answers)
														? [...editingQuestion.answers]
														: [];
													current.push({
														id: `opt-${Date.now()}`,
														text: `Phương án ${String.fromCharCode(65 + current.length)}`,
														is_correct: false,
														sort_order: current.length,
													});
													setEditingQuestion({ ...editingQuestion, answers: current });
												}}
											>
												+ Thêm phương án
											</Button>
										</div>

										<div className="space-y-2">
											{Array.isArray(editingQuestion.answers) &&
												editingQuestion.answers.map((ans: any, aIdx: number) => (
													<div
														key={ans.id || aIdx}
														className="flex items-center gap-2 bg-kumo-surface-subtle p-2 rounded-md border border-kumo-line"
													>
														<input
															type={editingQuestion.type === "single" ? "radio" : "checkbox"}
															name="correct_answer_select"
															checked={!!ans.is_correct}
															onChange={(e) => {
																const next = editingQuestion.answers.map((item: any, i: number) => {
																	if (editingQuestion.type === "single") {
																		return { ...item, is_correct: i === aIdx };
																	}
																	return i === aIdx
																		? { ...item, is_correct: e.target.checked }
																		: item;
																});
																setEditingQuestion({ ...editingQuestion, answers: next });
															}}
														/>
														<Input
															type="text"
															value={ans.text || ""}
															onChange={(e) => {
																const next = [...editingQuestion.answers];
																next[aIdx] = { ...next[aIdx], text: e.target.value };
																setEditingQuestion({ ...editingQuestion, answers: next });
															}}
															className="flex-1"
														/>
														<button
															type="button"
															onClick={() => {
																const next = editingQuestion.answers.filter(
																	(_: any, i: number) => i !== aIdx,
																);
																setEditingQuestion({ ...editingQuestion, answers: next });
															}}
															className="text-kumo-danger p-1"
														>
															<Trash className="w-4 h-4" />
														</button>
													</div>
												))}
										</div>
									</div>
								)}

								{/* Text / Fill Blank Editor */}
								{(editingQuestion.type === "text" || editingQuestion.type === "fill_blank") && (
									<div>
										<label className="block text-xs font-medium text-kumo-subtle mb-1">
											Đáp án đúng (chuỗi văn bản)
										</label>
										<Input
											type="text"
											placeholder="VD: Đào Thiên Hải, e4..."
											value={
												typeof editingQuestion.answers === "string" ? editingQuestion.answers : ""
											}
											onChange={(e) =>
												setEditingQuestion({ ...editingQuestion, answers: e.target.value })
											}
											className="w-full"
										/>
									</div>
								)}

								{/* Chess Question Editor */}
								{editingQuestion.type === "chess" && (
									<div className="space-y-3 pt-2">
										<div className="flex items-center justify-between">
											<div className="flex gap-2">
												<Button
													variant={chessTab === "board" ? "primary" : "secondary"}
													onClick={() => setChessTab("board")}
													className="text-xs"
												>
													1. Xếp thế cờ (FEN)
												</Button>
												<Button
													variant={chessTab === "moves" ? "primary" : "secondary"}
													onClick={() => setChessTab("moves")}
													className="text-xs"
												>
													2. Ghi nước giải (UCI)
												</Button>
												<Button
													variant={chessTab === "test" ? "primary" : "secondary"}
													onClick={() => setChessTab("test")}
													className="text-xs"
												>
													3. Chạy thử câu đố
												</Button>
											</div>

											<Button
												variant="secondary"
												onClick={handleFetchPuzzleOptions}
												disabled={fetchingPuzzles}
												className="text-xs"
											>
												{fetchingPuzzles ? "Đang tải..." : "Lấy từ kho câu đố"}
											</Button>
										</div>

										{/* Puzzle Options Selector if available */}
										{puzzleOptions.length > 0 && (
											<div className="p-2 bg-kumo-surface-subtle rounded border border-kumo-line flex items-center gap-2">
												<span className="text-xs text-kumo-subtle">Kho câu đố:</span>
												<Select
													items={puzzleOptions.map((p) => ({ value: p.id, label: p.name }))}
													onValueChange={(val) => {
														if (val) {
															// Could fetch detail if chess-puzzles is enabled
															alert(`Đã chọn câu đố ID: ${val}`);
														}
													}}
												/>
											</div>
										)}

										{/* Tab 1: Position Editor */}
										{chessTab === "board" && (
											<div className="p-3 bg-kumo-surface-subtle rounded-lg border border-kumo-line">
												<PositionEditor
													initialFen={
														editingQuestion.answers?.fen || "6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1"
													}
													onChange={(newFen) => {
														const current = editingQuestion.answers || {};
														setEditingQuestion({
															...editingQuestion,
															answers: { ...current, fen: newFen },
														});
													}}
													width={420}
												/>
											</div>
										)}

										{/* Tab 2: Move Recorder */}
										{chessTab === "moves" && (
											<div className="p-3 bg-kumo-surface-subtle rounded-lg border border-kumo-line">
												<div className="text-xs text-kumo-subtle mb-2">
													Đi các nước đi giải đúng trên bàn cờ. Đối với câu đố nhiều nước, hãy đi cả
													nước đáp của đối thủ.
												</div>
												<MoveRecorder
													fen={editingQuestion.answers?.fen || "6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1"}
													initialMoves={editingQuestion.answers?.solution || []}
													onChange={(moves) => {
														const current = editingQuestion.answers || {};
														setEditingQuestion({
															...editingQuestion,
															answers: { ...current, solution: moves },
														});
													}}
													width={420}
												/>
											</div>
										)}

										{/* Tab 3: Test Puzzle */}
										{chessTab === "test" && (
											<div className="p-3 bg-kumo-surface-subtle rounded-lg border border-kumo-line">
												<PuzzlePlayer
													fen={editingQuestion.answers?.fen || "6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1"}
													solution={editingQuestion.answers?.solution || ["a1a8"]}
													width={420}
												/>
											</div>
										)}
									</div>
								)}

								<div className="flex justify-end gap-2 pt-3 border-t border-kumo-line">
									<Button variant="secondary" onClick={() => setEditingQuestion(null)}>
										Hủy
									</Button>
									<Button variant="primary" onClick={handleSaveQuestion}>
										Lưu câu hỏi
									</Button>
								</div>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

// ============================================================================
// Plugin Admin Exports (Named export `pages` for EmDash virtual module import)
// ============================================================================

export const pages = {
	"/settings/setup": SetupPage,
	"/quizzes": QuizzesPage,
	"/students": StudentsPage,
	"/orders": OrdersPage,
	"/plans": PlansPage,
	"/members": MembersPage,
	"/settings/payment": PaymentSettingsPage,
	"/settings": SettingsPage,
};

export default {
	pages,
};
