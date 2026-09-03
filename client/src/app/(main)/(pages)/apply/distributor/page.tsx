import ApplyForm from "../ApplyForm";
import { ROLES } from "@/utils/roles";

export default function DistributorApplyPage() {
  return <ApplyForm requestedRole={ROLES.DISTRIBUTOR} />;
}
