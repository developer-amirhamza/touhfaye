"use client";
import PortalGuard from "../PortalGuard";
import { ROLES } from "@/utils/roles";
import ConsumerOrders from "./ConsumerOrders";

export default function ConsumerPortalPage() {
  return (
    <PortalGuard allow={[ROLES.CONSUMER, ROLES.ADMIN]}>
      <ConsumerOrders />
    </PortalGuard>
  );
}