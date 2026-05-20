"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AdminAuthGate } from "@/src/components/admin/AdminAuthGate";
import { AdminDashboard } from "@/src/components/admin/AdminDashboard";
import { SuperAdminDashboard } from "@/src/components/admin/SuperAdminDashboard";

function AdminContent() {
  const params = useSearchParams();
  const isSuperAdmin = params.get("role") === "superadmin";

  if (isSuperAdmin) {
    return (
      <AdminAuthGate panelLabel="Super Admin" requireSuperadmin>
        {(me) => <SuperAdminDashboard me={me} />}
      </AdminAuthGate>
    );
  }
  return (
    <AdminAuthGate panelLabel="Merchant">
      {(me) => <AdminDashboard me={me} />}
    </AdminAuthGate>
  );
}

export default function AdminRoute() {
  return (
    <div className="font-sans">
      <Suspense fallback={null}>
        <AdminContent />
      </Suspense>
    </div>
  );
}
