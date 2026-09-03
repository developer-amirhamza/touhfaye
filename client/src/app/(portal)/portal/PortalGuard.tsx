"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { normaliseRole, portalPath } from "@/utils/roles";

// Wraps a portal page and ensures the logged-in user holds one of `allow`.
// - not logged in            -> /signin
// - logged in, wrong role     -> their own portal
// - logged in, right role     -> render children
export default function PortalGuard({
  allow,
  children,
}: {
  allow: string[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, status } = useSelector((state: RootState) => state.userSlice);

  useEffect(() => {
    if (status === "loading" || status === "idle") return;
    if (!user) {
      router.replace("/signin");
      return;
    }
    const role = normaliseRole(user.role);
    if (!allow.includes(role)) {
      router.replace(portalPath(role));
    }
  }, [user, status, allow, router]);

  if (status === "loading" || status === "idle" || !user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-400">
        Loading your portal…
      </div>
    );
  }
  if (!allow.includes(normaliseRole(user.role))) return null;

  return <>{children}</>;
}