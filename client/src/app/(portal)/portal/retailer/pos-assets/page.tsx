"use client";
import PortalGuard from "../../PortalGuard";
import { ROLES } from "@/utils/roles";
import ResourceList from "../../ResourceList";

export default function RetailerPosAssetsPage() {
  return (
    <PortalGuard allow={[ROLES.RETAILER, ROLES.ADMIN]}>
      <ResourceList
        category="POS_ASSET"
        eyebrow="Retailer"
        title="POS & shelf assets"
        emptyText="No downloads available yet — check back soon."
      />
    </PortalGuard>
  );
}
