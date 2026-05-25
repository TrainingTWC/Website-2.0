"use client";

import { useMemo } from "react";
import { STUDIO_SLOTS, type StudioSlot } from "@/src/lib/studioSlots";

type Props = {
  slot: StudioSlot;
  slotKey: string;
  onSlotChange: (slot: StudioSlot) => void;
  onSlotKeyChange: (slotKey: string) => void;
  productSlugs?: readonly string[];
  disabled?: boolean;
};

const SLOT_LABELS: Record<StudioSlot, string> = {
  brew_method: "Brew Method",
  brew_step: "Brew Step",
  signature: "Signature Drink",
  product: "Product",
  ambience: "Ambience",
};

/**
 * Slot + slotKey picker. Enforces STUDIO_SLOTS registry; "product" slot keys
 * come from the live products table at runtime (passed via productSlugs).
 */
export function SlotPicker({
  slot,
  slotKey,
  onSlotChange,
  onSlotKeyChange,
  productSlugs,
  disabled,
}: Props) {
  const slotKeyOptions = useMemo<readonly string[]>(() => {
    if (slot === "product") return productSlugs ?? [];
    return STUDIO_SLOTS[slot];
  }, [slot, productSlugs]);

  return (
    <div className="grid grid-cols-2 gap-3">
      <label className="block text-xs font-medium text-stone-700">
        Slot
        <select
          className="mt-1 w-full rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm"
          value={slot}
          disabled={disabled}
          onChange={(e) => {
            const next = e.target.value as StudioSlot;
            onSlotChange(next);
            // Reset slotKey to first valid option of the new slot.
            const opts =
              next === "product" ? productSlugs ?? [] : STUDIO_SLOTS[next];
            onSlotKeyChange(opts[0] ?? "");
          }}
        >
          {(Object.keys(STUDIO_SLOTS) as StudioSlot[]).map((s) => (
            <option key={s} value={s}>
              {SLOT_LABELS[s]}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-xs font-medium text-stone-700">
        Slot Key
        <select
          className="mt-1 w-full rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm"
          value={slotKey}
          disabled={disabled || slotKeyOptions.length === 0}
          onChange={(e) => onSlotKeyChange(e.target.value)}
        >
          {slotKeyOptions.length === 0 && (
            <option value="">— no keys available —</option>
          )}
          {slotKeyOptions.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
