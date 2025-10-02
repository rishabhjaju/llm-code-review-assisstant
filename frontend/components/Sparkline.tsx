import React from 'react'

type Props = {
  values: number[]
  width?: number
  height?: number
  stroke?: string
  fill?: string
}

export default function Sparkline({ values, width = 120, height = 28, stroke = '#10B981', fill = 'rgba(16,185,129,0.12)' }: Props) {
  if (!values || values.length === 0) {
    return <svg width={width} height={height} />
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const step = width / Math.max(1, values.length - 1)
  const points = values.map((v, i) => {
    const x = i * step
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  })

  const path = `M${points.join(' L')}`
  // build polygon for fill
  const poly = `0,${height} ${points.join(' ')} ${width},${height}`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polygon points={poly} fill={fill} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
