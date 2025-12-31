"use client";

type Datum = { label: string; value: number };

export default function MiniBar({ data, maxBars = 8 }: { data: Datum[]; maxBars?: number }) {
  const top = [...data]
    .sort((a, b) => b.value - a.value)
    .slice(0, maxBars);
  const max = Math.max(1, ...top.map((d) => Math.abs(d.value)));
  return (
    <div className="space-y-2">
      {top.map((d) => (
        <div key={d.label} className="grid grid-cols-[1fr_auto] items-center gap-2">
          <div className="text-xs text-gray-600 truncate">{d.label}</div>
          <div className="text-xs tabular-nums">{d.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="col-span-2 h-2 bg-gray-200 rounded"><div className="h-2 bg-gray-900 rounded" style={{ width: `${(Math.abs(d.value) / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}
