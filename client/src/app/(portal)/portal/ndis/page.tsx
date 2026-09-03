"use client";
import PortalGuard from "../PortalGuard";
import { ROLES } from "@/utils/roles";
import QuoteBuilder from "./QuoteBuilder";

export default function NdisPortalPage() {
  return (
    <PortalGuard allow={[ROLES.NDIS_COORDINATOR, ROLES.ADMIN]}>
      <QuoteBuilder />
    </PortalGuard>
  );
}