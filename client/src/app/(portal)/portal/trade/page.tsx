"use client";
import PortalGuard from "../PortalGuard";
import { ROLES, TRADE_FAMILY } from "@/utils/roles";
import TradeCatalogue from "./TradeCatalogue";

export default function TradePortalPage() {
  return (
    <PortalGuard allow={[...TRADE_FAMILY, ROLES.ADMIN]}>
      <TradeCatalogue />
    </PortalGuard>
  );
}