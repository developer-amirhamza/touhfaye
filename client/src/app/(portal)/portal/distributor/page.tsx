"use client";
import PortalGuard from "../PortalGuard";
import { ROLES } from "@/utils/roles";
import TradeCatalogue from "../trade/TradeCatalogue";

// A Distributor's own portal landing page — this is where portalPath() sends
// them straight after login. Renders the same shared wholesale catalogue as
// /portal/trade (see TRADE_FAMILY), just under the Distributor's own URL.
export default function DistributorPortalPage() {
  return (
    <PortalGuard allow={[ROLES.DISTRIBUTOR, ROLES.ADMIN]}>
      <TradeCatalogue />
    </PortalGuard>
  );
}
