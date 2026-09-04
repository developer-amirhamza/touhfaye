"use client";
import PortalGuard from "../../PortalGuard";
import { ROLES } from "@/utils/roles";
import ResourceList from "../../ResourceList";

export default function DistributorCertificationsPage() {
  return (
    <PortalGuard allow={[ROLES.DISTRIBUTOR, ROLES.ADMIN]}>
      <ResourceList
        category="CERTIFICATION"
        eyebrow="Distributor"
        title="Certification library"
        emptyText="No certifications available yet — check back soon."
      />
    </PortalGuard>
  );
}
