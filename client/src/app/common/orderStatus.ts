// Canonical order-status values (Order.orderStatus in the DB) and their
// customer-facing labels/order. Shared by the admin order tools and the
// customer-facing order list/detail pages so both sides always agree on
// what each status means and how it's displayed.

export interface OrderStatusStep {
    value: string;
    label: string;
}

// The normal, linear progress of an order. "Pending" is kept as the stored
// value (not renamed to e.g. "Placed") so existing orders in the database
// don't need a migration — only its display label changes.
export const ORDER_STATUS_STEPS: OrderStatusStep[] = [
    { value: "Pending", label: "Order placed" },
    { value: "Approved", label: "Order approved" },
    { value: "Preparing", label: "Preparing your order" },
    { value: "ReadyToShip", label: "Ready to ship" },
    { value: "WithCourier", label: "With the courier" },
    { value: "Delivered", label: "Delivered" },
];

// A terminal state outside the normal progress — never shown as a step in
// the timeline, only as its own banner/badge.
export const CANCELLED_STATUS = "Cancelled";

export const ALL_ORDER_STATUSES: string[] = [
    ...ORDER_STATUS_STEPS.map((s) => s.value),
    CANCELLED_STATUS,
];

export const orderStatusLabel = (status: string): string => {
    if (status === CANCELLED_STATUS) return "Cancelled";
    return ORDER_STATUS_STEPS.find((s) => s.value === status)?.label ?? status;
};

// Index into ORDER_STATUS_STEPS, or -1 for an unknown/cancelled status.
export const orderStatusStepIndex = (status: string): number =>
    ORDER_STATUS_STEPS.findIndex((s) => s.value === status);

export interface StatusHistoryEntry {
    status: string;
    at: string;
}

// Looks up when an order first reached a given step, from its statusHistory
// log. Falls back to the order's createdAt for the very first step (Pending)
// since that one is implicit at creation, not logged.
export const statusReachedAt = (
    history: StatusHistoryEntry[] | null | undefined,
    status: string,
    createdAt: string
): string | null => {
    if (status === "Pending") return createdAt;
    const entry = history?.find((h) => h.status === status);
    return entry?.at ?? null;
};
