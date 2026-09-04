import ApplyForm from "../ApplyForm";
import { ROLES } from "@/utils/roles";

export default function NdisApplyPage() {
  return <ApplyForm requestedRole={ROLES.NDIS_COORDINATOR} />;
}