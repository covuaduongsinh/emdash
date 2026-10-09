/**
 * LMS Plugin Routes Index
 */

export { accessRoute, accessRouteInputSchema } from "./access.js";
export {
	adminOrdersConfirmInputSchema,
	adminOrdersConfirmRoute,
	adminOrdersListInputSchema,
	adminOrdersListRoute,
} from "./admin-orders.js";
export { adminPaymentSettingsInputSchema, adminPaymentSettingsRoute } from "./admin-settings.js";
export { adminStudentsInputSchema, adminStudentsRoute } from "./admin-students.js";
export { checkoutCreateInputSchema, checkoutCreateRoute } from "./checkout-create.js";
export { checkoutRoute } from "./checkout.js";
export { meAccessInputSchema, meAccessRoute } from "./me-access.js";
export { meEnrollInputSchema, meEnrollRoute } from "./me-enroll.js";
export { meOrdersGetInputSchema, meOrdersGetRoute } from "./me-orders-get.js";
export { meProgressInputSchema, meProgressRoute } from "./me-progress.js";
export { membersRoute, membersRouteInputSchema } from "./members.js";
export { ordersRoute, ordersRouteInputSchema } from "./orders.js";
export { plansRoute, plansRouteInputSchema } from "./plans.js";
export { progressCompleteInputSchema, progressCompleteRoute } from "./progress-complete.js";
export { progressSyncInputSchema, progressSyncRoute } from "./progress-sync.js";
export {
	adminQuizDeleteInputSchema,
	adminQuizDeleteRoute,
	adminQuizGetInputSchema,
	adminQuizGetRoute,
	adminQuizListInputSchema,
	adminQuizListRoute,
	adminQuizOptionsInputSchema,
	adminQuizOptionsRoute,
	adminQuizSaveInputSchema,
	adminQuizSaveRoute,
	adminQuestionDeleteInputSchema,
	adminQuestionDeleteRoute,
	adminQuestionReorderInputSchema,
	adminQuestionReorderRoute,
	adminQuestionSaveInputSchema,
	adminQuestionSaveRoute,
} from "./admin-quiz.js";
export { quizPresentInputSchema, quizPresentRoute } from "./quiz-present.js";
export { meQuizSubmitRoute, quizSubmitInputSchema, quizSubmitRoute } from "./quiz-submit.js";
export { setupRunInputSchema, setupRunRoute } from "./setup.js";
export { webhookSepayInputSchema, webhookSepayRoute } from "./webhook-sepay.js";
export { webhooksRoute } from "./webhooks.js";
