"use client";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { OrderPortal } from "@/src/components/OrderPortal";
import { OrderConfirmation } from "@/src/components/OrderConfirmation";
import { SiteFooter } from "@/src/components/SiteFooter";
import { useCart } from "@/src/context/CartContext";
import { hrefForNavTarget } from "@/src/lib/navigation";

function OrdersWrapper() {
  const params = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();

  const confirmId = params.get("confirm");
  const initialOrderId = params.get("id") ?? undefined;

  if (confirmId) {
    return (
      <OrderConfirmation
        orderId={confirmId}
        onContinueShopping={() => { clearCart(); router.push("/"); }}
      />
    );
  }

  return <OrderPortal initialOrderId={initialOrderId} />;
}

export default function OrdersRoute() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-natural-bg text-natural-text font-sans flex flex-col">
      <div className="flex-1">
        <Suspense fallback={null}>
          <OrdersWrapper />
        </Suspense>
      </div>
      <SiteFooter onNavigate={(t) => router.push(hrefForNavTarget(t))} />
    </div>
  );
}
