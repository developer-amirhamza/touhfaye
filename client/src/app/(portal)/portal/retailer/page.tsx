"use client";
import PortalGuard from "../PortalGuard";
import { ROLES } from "@/utils/roles";
import TradeCatalogue from "../trade/TradeCatalogue";

// A Retailer's own portal landing page — this is where portalPath() sends
// them straight after login. Renders the same shared wholesale catalogue as
// /portal/trade (see TRADE_FAMILY), just under the Retailer's own URL.
export default function RetailerPortalPage() {
  return (
    <PortalGuard allow={[ROLES.RETAILER, ROLES.ADMIN]}>
      <TradeCatalogue />
    </PortalGuard>
  );
}
