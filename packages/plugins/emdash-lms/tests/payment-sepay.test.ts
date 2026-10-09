/**
 * SePay VietQR Payment & Webhook Test Suite (Phase 2b)
 */

import { PluginRouteError, type RouteContext } from "emdash";
import { describe, expect, it, vi } from "vitest";

import { createPlugin } from "../src/index.js";
import {
	adminOrdersConfirmRoute,
	adminOrdersListRoute,
} from "../src/routes/admin-orders.js";
import { adminPaymentSettingsRoute } from "../src/routes/admin-settings.js";
import { checkoutCreateRoute } from "../src/routes/checkout-create.js";
import { meOrdersGetRoute } from "../src/routes/me-orders-get.js";
import { webhookSepayRoute } from "../src/routes/webhook-sepay.js";

function createMockContent(initialData: Record<string, any[]> = {}) {
	const db: Record<string, Map<string, any>> = {
		membership_plans: new Map(),
		courses: new Map(),
		orders: new Map(),
		memberships: new Map(),
		enrollments: new Map(),
	};

	for (const [col, items] of Object.entries(initialData)) {
		if (!db[col]) db[col] = new Map();
		for (const item of items) {
			db[col].set(item.id, item);
		}
	}

	return {
		get: vi.fn(async (col: string, id: string) => {
			const item = db[col]?.get(id);
			return item ? { id: item.id, data: { ...item } } : null;
		}),
		list: vi.fn(async (col: string, options?: any) => {
			const items = [...(db[col]?.values() || [])];
			let filtered = items;
			if (options?.where?.fieldFilters) {
				filtered = items.filter((item) => {
					for (const [k, v] of Object.entries(options.where.fieldFilters)) {
						if (item[k] !== v && item.data?.[k] !== v) {
							// check metadata too
							if (item.metadata?.[k] !== v) return false;
						}
					}
					return true;
				});
			}
			return {
				items: filtered.map((item) => ({ id: item.id, data: { ...item } })),
				nextCursor: undefined,
			};
		}),
		create: vi.fn(async (col: string, data: any) => {
			const id = `rec_${Math.random().toString(36).slice(2, 9)}`;
			const record = { id, ...data };
			if (!db[col]) db[col] = new Map();
			db[col].set(id, record);
			return { id, data: record };
		}),
		update: vi.fn(async (col: string, id: string, data: any) => {
			const existing = db[col]?.get(id);
			if (!existing) throw new Error(`Not found in ${col}: ${id}`);
			const updated = { ...existing, ...data };
			db[col].set(id, updated);
			return { id, data: updated };
		}),
		_db: db,
	};
}

function createMockKv(store: Record<string, any> = {}) {
	const map = new Map(Object.entries(store));
	return {
		get: vi.fn(async (key: string) => map.get(key) ?? null),
		set: vi.fn(async (key: string, val: any) => {
			map.set(key, val);
		}),
		delete: vi.fn(async (key: string) => {
			map.delete(key);
		}),
		_map: map,
	};
}

describe("Phase 2b: SePay VietQR Payment & Webhook Suite", () => {
	const TEST_SEPAY_API_KEY = "test-sepay-secret-key-12345";

	describe("1. SePay Webhook Authentication & Security", () => {
		it("rejects webhook request when Authorization header is missing", async () => {
			const content = createMockContent();
			const kv = createMockKv({ "settings:sepay_api_key": TEST_SEPAY_API_KEY });
			const headers = new Headers();

			const ctx: Partial<RouteContext> = {
				content: content as any,
				kv: kv as any,
				request: new Request("https://covuahocduong.com/_emdash/api/plugins/lms/webhook/sepay", {
					method: "POST",
					headers,
				}),
				input: {
					id: 12345,
					transferType: "in",
					transferAmount: 500000,
					content: "LMS-TESTCODE",
				},
			};

			await expect(webhookSepayRoute(ctx as RouteContext)).rejects.toThrow(PluginRouteError);
			await expect(webhookSepayRoute(ctx as RouteContext)).rejects.toMatchObject({
				status: 401,
				code: "UNAUTHORIZED",
			});
		});

		it("rejects webhook request when Authorization key is invalid", async () => {
			const content = createMockContent();
			const kv = createMockKv({ "settings:sepay_api_key": TEST_SEPAY_API_KEY });
			const headers = new Headers({
				Authorization: "Apikey WRONG_KEY_HERE",
			});

			const ctx: Partial<RouteContext> = {
				content: content as any,
				kv: kv as any,
				request: new Request("https://covuahocduong.com/_emdash/api/plugins/lms/webhook/sepay", {
					method: "POST",
					headers,
				}),
				input: {
					id: 12345,
					transferType: "in",
					transferAmount: 500000,
					content: "LMS-TESTCODE",
				},
			};

			await expect(webhookSepayRoute(ctx as RouteContext)).rejects.toMatchObject({
				status: 401,
				code: "UNAUTHORIZED",
			});
		});

		it("accepts webhook request with valid Authorization header (Apikey or Bearer)", async () => {
			const orderCode = "LMS-AUTH1234";
			const content = createMockContent({
				membership_plans: [{ id: "plan_gold", name: "Thẻ Vàng", billing_period: "monthly", price: 500000 }],
				orders: [
					{
						id: "ord_1",
						slug: orderCode.toLowerCase(),
						user_id: "usr_alice",
						type: "membership",
						item_id: "plan_gold",
						amount: 500000,
						status: "pending",
						metadata: { order_code: orderCode },
					},
				],
			});
			const kv = createMockKv({ "settings:sepay_api_key": TEST_SEPAY_API_KEY });
			const headers = new Headers({
				Authorization: `Apikey ${TEST_SEPAY_API_KEY}`,
			});

			const ctx: Partial<RouteContext> = {
				content: content as any,
				kv: kv as any,
				request: new Request("https://covuahocduong.com/_emdash/api/plugins/lms/webhook/sepay", {
					method: "POST",
					headers,
				}),
				input: {
					id: 92704,
					gateway: "MB",
					transferType: "in",
					transferAmount: 500000,
					content: `${orderCode} thanh toan the vang`,
				},
			};

			const result = await webhookSepayRoute(ctx as RouteContext);
			expect(result).toEqual({ success: true });

			// Verify order is marked completed
			const updatedOrder = content._db.orders.get("ord_1");
			expect(updatedOrder.status).toBe("completed");
			expect(updatedOrder.payment_provider).toBe("sepay");
			expect(updatedOrder.payment_id).toBe("92704");

			// Verify membership created
			const memberships = [...content._db.memberships.values()];
			expect(memberships.length).toBe(1);
			expect(memberships[0].user_id).toBe("usr_alice");
			expect(memberships[0].plan_id).toBe("plan_gold");
			expect(memberships[0].status).toBe("active");
		});
	});

	describe("2. Webhook Fulfillment & Idempotency", () => {
		it("fulfills course purchase order by creating course enrollment", async () => {
			const orderCode = "LMS-COURSE01";
			const content = createMockContent({
				courses: [{ id: "course_endgame", title: "Cờ Tàn Căn Bản", price: 300000 }],
				orders: [
					{
						id: "ord_2",
						slug: orderCode.toLowerCase(),
						user_id: "usr_bob",
						type: "course",
						item_id: "course_endgame",
						amount: 300000,
						status: "pending",
						metadata: { order_code: orderCode },
					},
				],
			});
			const kv = createMockKv({ "settings:sepay_api_key": TEST_SEPAY_API_KEY });
			const headers = new Headers({
				Authorization: `Apikey ${TEST_SEPAY_API_KEY}`,
			});

			const ctx: Partial<RouteContext> = {
				content: content as any,
				kv: kv as any,
				request: new Request("https://covuahocduong.com", { method: "POST", headers }),
				input: {
					id: 92705,
					gateway: "VCB",
					transferType: "in",
					transferAmount: 300000,
					content: `chuyen khoan ${orderCode}`,
				},
			};

			const result = await webhookSepayRoute(ctx as RouteContext);
			expect(result).toEqual({ success: true });

			// Verify enrollment created
			const enrollments = [...content._db.enrollments.values()];
			expect(enrollments.length).toBe(1);
			expect(enrollments[0].user_id).toBe("usr_bob");
			expect(enrollments[0].course_id).toBe("course_endgame");
			expect(enrollments[0].source).toBe("purchase");
			expect(enrollments[0].order_id).toBe("ord_2");
		});

		it("is idempotent: replaying the same webhook returns 200 without creating duplicate membership", async () => {
			const orderCode = "LMS-REPLAY99";
			const content = createMockContent({
				membership_plans: [{ id: "plan_annual", name: "Thẻ Năm", billing_period: "yearly", price: 1200000 }],
				orders: [
					{
						id: "ord_3",
						slug: orderCode.toLowerCase(),
						user_id: "usr_carol",
						type: "membership",
						item_id: "plan_annual",
						amount: 1200000,
						status: "pending",
						metadata: { order_code: orderCode },
					},
				],
			});
			const kv = createMockKv({ "settings:sepay_api_key": TEST_SEPAY_API_KEY });
			const headers = new Headers({
				Authorization: `Apikey ${TEST_SEPAY_API_KEY}`,
			});

			const ctx: Partial<RouteContext> = {
				content: content as any,
				kv: kv as any,
				request: new Request("https://covuahocduong.com", { method: "POST", headers }),
				input: {
					id: 92706,
					transferType: "in",
					transferAmount: 1200000,
					content: `CK ${orderCode}`,
				},
			};

			// First execution
			const res1 = await webhookSepayRoute(ctx as RouteContext);
			expect(res1).toEqual({ success: true });
			expect(content._db.memberships.size).toBe(1);

			// Replay same transaction
			const res2 = await webhookSepayRoute(ctx as RouteContext);
			expect(res2).toMatchObject({ success: true });
			// Ensure membership count is still 1 (no duplicate)
			expect(content._db.memberships.size).toBe(1);
		});

		it("does not activate when transfer amount is less than order amount (underpaid)", async () => {
			const orderCode = "LMS-UNDERPAY";
			const content = createMockContent({
				membership_plans: [{ id: "plan_vip", name: "Thẻ VIP", price: 1000000 }],
				orders: [
					{
						id: "ord_4",
						slug: orderCode.toLowerCase(),
						user_id: "usr_dave",
						type: "membership",
						item_id: "plan_vip",
						amount: 1000000,
						status: "pending",
						metadata: { order_code: orderCode },
					},
				],
			});
			const kv = createMockKv({ "settings:sepay_api_key": TEST_SEPAY_API_KEY });
			const headers = new Headers({
				Authorization: `Apikey ${TEST_SEPAY_API_KEY}`,
			});

			const ctx: Partial<RouteContext> = {
				content: content as any,
				kv: kv as any,
				request: new Request("https://covuahocduong.com", { method: "POST", headers }),
				input: {
					id: 92707,
					transferType: "in",
					transferAmount: 500000, // Only transferred 500k instead of 1000k
					content: `CK ${orderCode}`,
				},
			};

			const res = await webhookSepayRoute(ctx as RouteContext);
			expect(res).toMatchObject({ success: true, message: "Underpaid transfer" });
			expect(content._db.memberships.size).toBe(0);
			expect(content._db.orders.get("ord_4").status).toBe("pending");
		});

		it("does not activate when order is expired", async () => {
			const orderCode = "LMS-EXPIRED1";
			const pastDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
			const content = createMockContent({
				membership_plans: [{ id: "plan_vip", name: "Thẻ VIP", price: 500000 }],
				orders: [
					{
						id: "ord_5",
						slug: orderCode.toLowerCase(),
						user_id: "usr_eve",
						type: "membership",
						item_id: "plan_vip",
						amount: 500000,
						status: "pending",
						metadata: { order_code: orderCode, expires_at: pastDate },
					},
				],
			});
			const kv = createMockKv({ "settings:sepay_api_key": TEST_SEPAY_API_KEY });
			const headers = new Headers({
				Authorization: `Apikey ${TEST_SEPAY_API_KEY}`,
			});

			const ctx: Partial<RouteContext> = {
				content: content as any,
				kv: kv as any,
				request: new Request("https://covuahocduong.com", { method: "POST", headers }),
				input: {
					id: 92708,
					transferType: "in",
					transferAmount: 500000,
					content: `CK ${orderCode}`,
				},
			};

			const res = await webhookSepayRoute(ctx as RouteContext);
			expect(res).toMatchObject({ success: true, message: "Order has expired" });
			expect(content._db.memberships.size).toBe(0);
		});

		it("returns 200 without error when order code is not found (SePay best practice)", async () => {
			const content = createMockContent();
			const kv = createMockKv({ "settings:sepay_api_key": TEST_SEPAY_API_KEY });
			const headers = new Headers({
				Authorization: `Apikey ${TEST_SEPAY_API_KEY}`,
			});

			const ctx: Partial<RouteContext> = {
				content: content as any,
				kv: kv as any,
				request: new Request("https://covuahocduong.com", { method: "POST", headers }),
				input: {
					id: 92709,
					transferType: "in",
					transferAmount: 200000,
					content: "LMS-NOTFOUND",
				},
			};

			const res = await webhookSepayRoute(ctx as RouteContext);
			expect(res).toMatchObject({ success: true, message: "Order not found" });
		});
	});

	describe("3. Checkout Creation & Server-side Pricing", () => {
		it("calculates amount server-side and creates pending order with VietQR parameters", async () => {
			const content = createMockContent({
				membership_plans: [
					{
						id: "plan_pro",
						name: "Thẻ Chuyên Sâu",
						slug: "the-chuyen-sau",
						price: 1500000,
						sale_price: 1200000,
						currency: "VND",
					},
				],
			});
			const kv = createMockKv({
				"settings:bank_code": "MB",
				"settings:bank_account": "0987654321",
				"settings:account_name": "CTY CP CO VUA DUONG SINH",
			});

			const ctx: Partial<RouteContext> = {
				user: { id: "usr_student1", email: "student@dsc.edu.vn", role: 1, name: "Student 1", createdAt: new Date() },
				content: content as any,
				kv: kv as any,
				input: {
					itemId: "the-chuyen-sau",
					type: "membership",
				},
			};

			const res = await checkoutCreateRoute(ctx as RouteContext);

			expect(res.amount).toBe(1200000); // Uses sale_price server-side
			expect(res.orderCode).toMatch(/^LMS-[A-Z0-9]{8}$/);
			expect(res.bankCode).toBe("MB");
			expect(res.bankAccount).toBe("0987654321");
			expect(res.accountName).toBe("CTY CP CO VUA DUONG SINH");
			expect(res.qrUrl).toContain("qr.sepay.vn/img");
			expect(res.qrUrl).toContain("0987654321");

			// Check order in DB
			const orders = [...content._db.orders.values()];
			expect(orders.length).toBe(1);
			expect(orders[0].user_id).toBe("usr_student1");
			expect(orders[0].amount).toBe(1200000);
			expect(orders[0].status).toBe("pending");
		});

		it("rejects unauthenticated checkout creation", async () => {
			const content = createMockContent();
			const ctx: Partial<RouteContext> = {
				user: undefined,
				content: content as any,
				input: { itemId: "plan_1", type: "membership" },
			};

			await expect(checkoutCreateRoute(ctx as RouteContext)).rejects.toMatchObject({
				status: 401,
				code: "UNAUTHORIZED",
			});
		});
	});

	describe("4. Student Order Polling & Strict IDOR Protection", () => {
		it("allows student to fetch their own order", async () => {
			const content = createMockContent({
				orders: [
					{
						id: "ord_own",
						slug: "lms-own12345",
						user_id: "usr_me",
						type: "membership",
						amount: 500000,
						status: "pending",
					},
				],
			});

			const ctx: Partial<RouteContext> = {
				user: { id: "usr_me", email: "me@test.com", role: 1, name: "Me", createdAt: new Date() },
				content: content as any,
				input: { orderId: "ord_own" },
			};

			const res = await meOrdersGetRoute(ctx as RouteContext);
			expect(res.id).toBe("ord_own");
			expect(res.user_id).toBe("usr_me");
		});

		it("strictly prevents accessing another user's order (IDOR protected)", async () => {
			const content = createMockContent({
				orders: [
					{
						id: "ord_other",
						slug: "lms-other123",
						user_id: "usr_victim",
						type: "membership",
						amount: 2000000,
						status: "pending",
					},
				],
			});

			const ctx: Partial<RouteContext> = {
				user: { id: "usr_attacker", email: "attacker@test.com", role: 1, name: "Attacker", createdAt: new Date() },
				content: content as any,
				input: { orderId: "ord_other" },
			};

			await expect(meOrdersGetRoute(ctx as RouteContext)).rejects.toMatchObject({
				status: 403,
				code: "FORBIDDEN",
			});
		});
	});

	describe("5. Admin Orders Management & Manual Confirmation", () => {
		it("allows admin to manually confirm an order and fulfill membership", async () => {
			const content = createMockContent({
				membership_plans: [{ id: "plan_manual", name: "Thẻ Học Đường", billing_period: "monthly", price: 300000 }],
				orders: [
					{
						id: "ord_manual_1",
						user_id: "usr_student9",
						type: "membership",
						item_id: "plan_manual",
						amount: 300000,
						status: "pending",
						metadata: { order_code: "LMS-MANUAL01" },
					},
				],
			});

			const ctx: Partial<RouteContext> = {
				user: { id: "usr_admin", email: "admin@dsc.edu.vn", role: 4, name: "Coach Admin", createdAt: new Date() },
				content: content as any,
				input: {
					orderId: "ord_manual_1",
					reason: "Khách chuyển khoản ghi nhầm cú pháp, đã đối soát sao kê",
				},
			};

			const res = await adminOrdersConfirmRoute(ctx as RouteContext);
			expect(res).toEqual({ success: true });

			const updatedOrder = content._db.orders.get("ord_manual_1");
			expect(updatedOrder.status).toBe("completed");
			expect(updatedOrder.metadata.manual_confirmed_by).toBe("usr_admin");
			expect(updatedOrder.metadata.manual_confirm_reason).toContain("đã đối soát");

			// Membership is activated
			const memberships = [...content._db.memberships.values()];
			expect(memberships.length).toBe(1);
			expect(memberships[0].user_id).toBe("usr_student9");
			expect(memberships[0].status).toBe("active");
		});

		it("admin lists orders with status filter", async () => {
			const content = createMockContent({
				orders: [
					{ id: "o1", user_id: "u1", status: "pending", amount: 100 },
					{ id: "o2", user_id: "u2", status: "completed", amount: 200 },
				],
			});

			const ctx: Partial<RouteContext> = {
				content: content as any,
				input: { status: "pending" },
			};

			const res = await adminOrdersListRoute(ctx as RouteContext);
			expect(res.items.length).toBe(1);
			expect(res.items[0].id).toBe("o1");
		});
	});

	describe("6. Admin Payment Settings API", () => {
		it("can save and get payment configuration via KV", async () => {
			const kv = createMockKv();
			const ctx: Partial<RouteContext> = {
				kv: kv as any,
				input: {
					action: "save",
					data: {
						bank_code: "VCB",
						bank_account: "001100223344",
						account_name: "DUONG SINH CHESS",
						sepay_api_key: "my-secret-key",
						qr_template: "standee",
						expires_in_hours: 48,
					},
				},
			};

			const saveRes = await adminPaymentSettingsRoute(ctx as RouteContext);
			expect(saveRes).toEqual({ success: true });

			// Get back
			ctx.input = { action: "get" };
			const getRes = await adminPaymentSettingsRoute(ctx as RouteContext);
			expect(getRes.bank_code).toBe("VCB");
			expect(getRes.bank_account).toBe("001100223344");
			expect(getRes.account_name).toBe("DUONG SINH CHESS");
			expect(getRes.has_sepay_api_key).toBe(true);
			expect(getRes.qr_template).toBe("standee");
			expect(getRes.expires_in_hours).toBe(48);
		});
	});

	describe("7. Plugin Registration", () => {
		it("registers checkout/create, me/orders/get, webhook/sepay, and admin payment routes", () => {
			const plugin = createPlugin();
			const routes = (plugin as any).routes;

			expect(routes["checkout/create"]).toBeDefined();
			expect(routes["me/orders/get"]).toBeDefined();
			expect(routes["webhook/sepay"]).toBeDefined();
			expect(routes["webhook/sepay"].public).toBe(true);
			expect(routes["admin/orders/list"]).toBeDefined();
			expect(routes["admin/orders/confirm"]).toBeDefined();
			expect(routes["admin/settings/payment"]).toBeDefined();
		});
	});
});
