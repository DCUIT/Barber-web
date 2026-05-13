import { useEffect, useMemo, useRef } from 'react';

export default function RevenueChart({ data = [] }) {
  const canvasRef = useRef(null);

  const { labels, revenues } = useMemo(() => {
    const labels = data.map((item, idx) => item.label ?? item.date ?? item.day ?? `Day ${idx + 1}`);
    const revenues = data.map((item) => Number(item.revenue ?? item.amount ?? 0));
    return { labels, revenues };
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Nếu chart.js chưa có thì skip render canvas.
    if (!window.Chart) {
      return;
    }


    const ctx = canvas.getContext('2d');

    // Destroy chart cũ nếu có
    const existing = window.Chart.getChart?.(ctx);
    if (existing) existing.destroy();

    const chartLabels = labels.length ? labels : ['05/12', '06/13', '07/13', '08/13', '09/13', '10/13'];
    const chartData = revenues.length ? revenues : [10, 50, 30, 80, 20, 90];

    new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [
          {
            label: 'Doanh thu (đ)',
            data: chartData,
            borderColor: '#c4a47c',
            backgroundColor: 'rgba(196, 164, 124, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { display: false },
          x: { grid: { display: false }, ticks: { color: '#666', font: { size: 10 } } },
        },
      },
    });
  }, [labels, revenues]);

  return (
    <div style={{ height: 320 }}>
      <canvas ref={canvasRef} />
      {!window.Chart && (
        <div style={{ color: '#888', fontSize: 12, marginTop: 10 }}>
          Chart.js chưa được nạp. (Giao diện admin đã cập nhật theo mẫu)
        </div>
      )}
    </div>
  );
}
