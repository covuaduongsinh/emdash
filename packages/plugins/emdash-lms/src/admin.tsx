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
import {
	Bank,
	CheckCircle,
	CreditCard,
	Gear,
	Receipt,
	Student,
	UserCheck,
	UserPlus,
	WarningCircle,
	Wrench,
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
											<td className="p-3 font-mono font-medium text-kumo-brand">
												{orderCode}
											</td>
											<td className="p-3 text-kumo-subtle text-xs">{order.user_id}</td>
											<td className="p-3">
												<span className="font-medium text-xs">
													{order.metadata?.item_name ||
														(order.type === "membership" ? "Thẻ thư viện" : "Khóa học")}
												</span>
											</td>
											<td className="p-3 font-semibold text-sm">
												{formatCurrency(order.amount)}
											</td>
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
								<strong>Mã đơn:</strong> {confirmingOrder.metadata?.order_code || confirmingOrder.id}
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
										{m.expires_at ? new Date(m.expires_at).toLocaleDateString("vi-VN") : "Vĩnh viễn"}
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
							Được dùng để xác thực webhook gửi đến từ SePay (`Authorization: Apikey
							&lt;KEY&gt;`).
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
// Plugin Admin Exports (Named export `pages` for EmDash virtual module import)
// ============================================================================

export const pages = {
	"/settings/setup": SetupPage,
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
