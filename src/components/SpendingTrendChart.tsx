"use client";

import { useEffect, useRef } from "react";

interface TrendData {
  date: string;
  amount: number;
}

interface SpendingTrendChartProps {
  data: TrendData[];
  height?: number;
}

export default function SpendingTrendChart({ data, height = 200 }: SpendingTrendChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, height);

    // Calculate dimensions
    const padding = 40;
    const chartWidth = rect.width - padding * 2;
    const chartHeight = height - padding * 2;

    // Find min and max values
    const amounts = data.map(d => d.amount);
    const maxAmount = Math.max(...amounts);
    const minAmount = Math.min(...amounts, 0);
    const range = maxAmount - minAmount || 1;

    // Draw grid lines
    const isDark = document.documentElement.classList.contains('dark');
    ctx.strokeStyle = isDark ? "#3f3f46" : "#e5e5e5";
    ctx.lineWidth = 0.5;
    ctx.setLineDash([5, 5]);

    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(rect.width - padding, y);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // Draw trend line
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, "rgba(37, 99, 235, 0.3)");
    gradient.addColorStop(1, "rgba(37, 99, 235, 0.05)");

    ctx.beginPath();
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";

    // Create path for area fill
    ctx.moveTo(padding, height - padding);

    data.forEach((point, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index;
      const y = padding + chartHeight - ((point.amount - minAmount) / range) * chartHeight;
      
      if (index === 0) {
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    // Complete area path
    const lastX = padding + chartWidth;
    ctx.lineTo(lastX, height - padding);
    ctx.closePath();
    
    // Fill area
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    data.forEach((point, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index;
      const y = padding + chartHeight - ((point.amount - minAmount) / range) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw points
    data.forEach((point, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index;
      const y = padding + chartHeight - ((point.amount - minAmount) / range) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#2563eb";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw labels
    ctx.fillStyle = isDark ? "#374151" : "#6b7280";
    ctx.font = "11px system-ui";
    ctx.textAlign = "center";

    // X-axis labels (dates)
    data.forEach((point, index) => {
      if (index % Math.ceil(data.length / 5) === 0 || index === data.length - 1) {
        const x = padding + (chartWidth / (data.length - 1)) * index;
        const date = new Date(point.date);
        const label = `${date.getMonth() + 1}/${date.getDate()}`;
        ctx.fillText(label, x, height - padding + 20);
      }
    });

    // Y-axis labels (amounts)
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const value = minAmount + (range / 4) * (4 - i);
      const y = padding + (chartHeight / 4) * i;
      ctx.fillText(`$${value.toFixed(0)}`, padding - 10, y + 4);
    }
  }, [data, height]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ height: `${height}px` }}
    />
  );
}