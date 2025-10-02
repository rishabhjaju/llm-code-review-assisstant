'use client'

import React from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
} from 'chart.js'

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip)

export default function MiniChart({ values, color = '#10B981', labels }: { values: number[]; color?: string; labels?: (string | number)[] }) {
  const data = {
    labels: labels ?? values.map((_, i) => i + 1),
    datasets: [
      {
        data: values,
        borderColor: color,
        backgroundColor: color,
        tension: 0.3,
        pointRadius: 0,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: true, mode: 'index', intersect: false } },
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: { display: false },
      y: { display: false }
    }
  }

  return (
    <div style={{ width: 120, height: 28 }}>
      <Line data={data} options={options as any} />
    </div>
  )
}
