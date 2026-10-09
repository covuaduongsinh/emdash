/**
 * SePay Payment Provider (Vietnam)
 * Official Webhook & VietQR integration for SePay (https://sepay.vn)
 */

import type {
	CheckoutSession,
	Order,
	PaymentProvider,
	PaymentProviderConfig,
	PaymentStatus,
	WebhookResult,
} from "../types.js";

const SEPAY_API_URL = "https://my.sepay.vn/userapi";
const ORDER_CODE_REGEX = /LMS-[A-Z0-9]{6,12}/i;
const AUTH_HEADER_PREFIX_REGEX = /^(Apikey|Bearer)\s+/i;

export interface SepayWebhookPayload {
	id: number | string;
	gateway?: string;
	transactionDate?: string;
	accountNumber?: string;
	subAccount?: string | null;
	code?: string | null;
	content?: string;
	transferType?: "in" | "out";
	description?: string | null;
	transferAmount?: number;
	accumulated?: number;
	referenceCode?: string | null;
}

export function extractLmsOrderCode(content: string = ""): string | null {
	const match = content.match(ORDER_CODE_REGEX);
	return match ? match[0].toUpperCase() : null;
}

export function generateVietQrUrl(params: {
	bankCode: string;
	bankAccount: string;
	amount: number;
	description: string;
	template?: string;
}): string {
	const template = params.template || "compact";
	const search = new URLSearchParams({
		acc: params.bankAccount,
		bank: params.bankCode,
		amount: String(Math.round(params.amount)),
		des: params.description,
		template,
	});
	return `https://qr.sepay.vn/img?${search.toString()}`;
}

export function verifySepayApiKey(
	authHeader: string | null | undefined,
	configuredKey: string | null | undefined,
): boolean {
	if (!configuredKey || configuredKey.trim().length === 0) {
		return false;
	}
	if (!authHeader || authHeader.trim().length === 0) {
		return false;
	}

	// SePay sends header `Authorization: Apikey <API_KEY>` or `Bearer <API_KEY>` or raw API key
	const cleanedHeader = authHeader.replace(AUTH_HEADER_PREFIX_REGEX, "").trim();
	return cleanedHeader === configuredKey.trim();
}

export const sepayProvider: PaymentProvider = {
	id: "sepay",
	name: "SePay VietQR",

	async createCheckout(order: Order, config: PaymentProviderConfig): Promise<CheckoutSession> {
		const orderCode =
			((order.metadata as Record<string, unknown> | undefined)?.order_code as string) ||
			`LMS-${order.id.slice(-8).toUpperCase()}`;

		const bankCode = config.credentials.bank_code || "MB";
		const bankAccount = config.credentials.bank_account || "";
		const template = config.credentials.qr_template || "compact";

		const qrUrl = generateVietQrUrl({
			bankCode,
			bankAccount,
			amount: order.amount,
			description: orderCode,
			template,
		});

		return {
			id: orderCode,
			url: qrUrl,
			expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
		};
	},

	async handleWebhook(
		payload: unknown,
		headers: Record<string, string>,
		config: PaymentProviderConfig,
	): Promise<WebhookResult> {
		const authHeader =
			headers["authorization"] || headers["x-sepay-api-key"] || headers["x-api-key"];
		const apiKey = config.credentials.api_key || config.webhook_secret;

		if (!verifySepayApiKey(authHeader, apiKey)) {
			throw new Error("Invalid SePay authorization header");
		}

		const data = payload as SepayWebhookPayload;
		if (data.transferType === "in" && (data.transferAmount ?? 0) > 0) {
			const fullContent = `${data.content || ""} ${data.description || ""} ${data.code || ""}`;
			const orderCode = extractLmsOrderCode(fullContent);

			return {
				event: "payment.completed",
				orderId: orderCode || undefined,
				status: "completed",
				metadata: {
					transactionId: data.id,
					bankCode: data.gateway,
					amount: data.transferAmount,
					referenceCode: data.referenceCode,
				},
			};
		}

		return { event: "unknown" };
	},

	async verifyPayment(paymentId: string, config: PaymentProviderConfig): Promise<PaymentStatus> {
		if (!config.credentials.api_key) {
			return { paid: false, status: "unconfigured" };
		}

		const response = await fetch(
			`${SEPAY_API_URL}/transactions/list?reference_number=${encodeURIComponent(paymentId)}`,
			{
				headers: {
					Authorization: `Bearer ${config.credentials.api_key}`,
					"Content-Type": "application/json",
				},
			},
		);

		if (!response.ok) {
			return { paid: false, status: "unknown" };
		}

		const data = (await response.json()) as {
			transactions?: Array<{
				id: number;
				transferType: "in" | "out";
				transferAmount: number;
				content: string;
			}>;
		};

		const transaction = data.transactions?.[0];
		if (!transaction) {
			return { paid: false, status: "not_found" };
		}

		return {
			paid: transaction.transferType === "in",
			status: transaction.transferType === "in" ? "completed" : "pending",
			amount: transaction.transferAmount,
			currency: "VND",
		};
	},
};
