"use client";

import { EnergyMeter } from "@/components/ui/energy-meter";

export default function EnergyMeterDemo() {
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center bg-background p-8">
      <div className="grid w-full max-w-sm gap-4">
        <EnergyMeter value={82} label="Reactor Output" showValue />
        <EnergyMeter value={54} label="Shield Integrity" showValue />
        <EnergyMeter value={18} label="Power Reserve" showValue />
      </div>
    </div>
  );
}
