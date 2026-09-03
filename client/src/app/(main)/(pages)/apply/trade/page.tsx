import ApplyForm from "../ApplyForm";
import { ROLES } from "@/utils/roles";

export default function TradeApplyPage() {
  return <ApplyForm requestedRole={ROLES.TRADE} />;
}