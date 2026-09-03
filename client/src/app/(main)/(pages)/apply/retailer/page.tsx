import ApplyForm from "../ApplyForm";
import { ROLES } from "@/utils/roles";

export default function RetailerApplyPage() {
  return <ApplyForm requestedRole={ROLES.RETAILER} />;
}
