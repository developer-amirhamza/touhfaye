// Mirrors client/src/app/common/orderStatus.ts — keep the value list in sync
// with that file (display labels/step order live there; this is just the
// server's validation list).
export const ORDER_STATUSES = [
    "Pending",
    "Approved",
    "Preparing",
    "ReadyToShip",
    "WithCourier",
    "Delivered",
    "Cancelled",
] as const;

export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export const isValidOrderStatus = (value: unknown): value is OrderStatusValue =>
    typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
