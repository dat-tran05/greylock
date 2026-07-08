"use client";

import { useMemo } from "react";

const SPARK_COLORS = ["#ff0000", "#ffff00", "#00ffff", "#ff00ff", "#00ff00"];
const BURST_POINTS = [
  { x: 20, y: 20 },
  { x: 80, y: 15 },
  { x: 50, y: 35 },
  { x: 15, y: 60 },
  { x: 85, y: 55 },
];
const SPARKS_PER_BURST = 10;

interface Spark {
  id: string;
  left: string;
  top: string;
  color: string;
  dx: number;
  dy: number;
  delay: number;
}

function buildSparks(): Spark[] {
  const sparks: Spark[] = [];
  BURST_POINTS.forEach((point, burstIndex) => {
    for (let i = 0; i < SPARKS_PER_BURST; i++) {
      const angle = (Math.PI * 2 * i) / SPARKS_PER_BURST;
      const dist = 30 + Math.random() * 25;
      sparks.push({
        id: `${burstIndex}-${i}`,
        left: `${point.x}%`,
        top: `${point.y}%`,
        color: SPARK_COLORS[(burstIndex + i) % SPARK_COLORS.length],
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        delay: burstIndex * 0.15,
      });
    }
  });
  return sparks;
}

export function Fireworks({ active }: { active: boolean }) {
  const sparks = useMemo(() => (active ? buildSparks() : []), [active]);

  if (!active) return null;

  return (
    <div className="fireworks-overlay">
      {sparks.map((spark) => (
        <div
          key={spark.id}
          className="spark"
          style={{
            left: spark.left,
            top: spark.top,
            background: spark.color,
            animationDelay: `${spark.delay}s`,
            ["--dx" as any]: `${spark.dx}px`,
            ["--dy" as any]: `${spark.dy}px`,
          }}
        />
      ))}
    </div>
  );
}
