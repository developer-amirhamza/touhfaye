// Canonical roles (mirrors the backend middlewares/role.ts).
export const ROLES = {
  CONSUMER: "CONSUMER",
  // Legacy generic wholesale role — existing accounts keep working exactly
  // as before. New business signups now pick RETAILER or DISTRIBUTOR
  // instead, but all three share the same wholesale catalogue/order/pricing
  // mechanics (see TRADE_FAMILY).
  TRADE: "TRADE",
  RETAILER: "RETAILER",
  DISTRIBUTOR: "DISTRIBUTOR",
  NDIS_COORDINATOR: "NDIS_COORDINATOR",
  ADMIN: "ADMIN",
  // Site owner: full admin access; the account itself can't be modified,
  // demoted or deleted by anyone (enforced server-side).
  OWNER: "OWNER",
} as const;

// Every role that gets the wholesale catalogue, order history, standing
// orders and delivery-site pages — only the role-specific extras (POS
// assets, certifications, credit/balance) differ between them.
export const TRADE_FAMILY: string[] = [ROLES.TRADE, ROLES.RETAILER, ROLES.DISTRIBUTOR];

// Legacy "USER" is treated as CONSUMER.
export const normaliseRole = (role?: string | null): string =>
  role === "USER" || !role ? ROLES.CONSUMER : role;

// Which landing route a logged-in user should be sent to.
export const portalPath = (role?: string | null): string => {
  switch (normaliseRole(role)) {
    case ROLES.OWNER:
    case ROLES.ADMIN:
      return "/admin";
    case ROLES.TRADE:
      return "/portal/trade";
    case ROLES.RETAILER:
      return "/portal/retailer";
    case ROLES.DISTRIBUTOR:
      return "/portal/distributor";
    case ROLES.NDIS_COORDINATOR:
      return "/portal/ndis";
    default:
      return "/portal/consumer";
  }
};
