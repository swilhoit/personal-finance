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
          <div className="text-xs text-zinc-600 dark:text-zinc-400 truncate">{d.label}</div>
          <div className="text-xs tabular-nums">{d.value.toFixed(2)}</div>
          <div className="col-span-2 h-2 bg-zinc-200 dark:bg-zinc-800 rounded"><div className="h-2 bg-black dark:bg-white rounded" style={{ width: `${(Math.abs(d.value) / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}
