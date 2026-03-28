import { useMemo, useState } from "react";

const CELL = 13;
const GAP = 3;
const TOTAL = CELL + GAP;
const WEEKS = 53;
const DAYS = 7;
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function getLevel(count) {
  if (!count) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

export default function ActivityHeatmap({ data = {} }) {
  const [hoveredCell, setHoveredCell] = useState(null);

  const { cells, monthLabels } = useMemo(() => {
    const today = new Date();
    const cells = [];
    const monthLabels = [];
    const seenMonths = new Set();

    // Start from 52 weeks ago on the nearest Sunday
    const start = new Date(today);
    start.setDate(start.getDate() - (WEEKS - 1) * 7 - start.getDay());

    for (let week = 0; week < WEEKS; week++) {
      for (let day = 0; day < DAYS; day++) {
        const d = new Date(start);
        d.setDate(d.getDate() + week * 7 + day);

        if (d > today) continue;

        const key = d.toISOString().slice(0, 10);
        const entry = data[key];
        const count = entry?.count || 0;
        const scores = entry?.scores || [];

        cells.push({
          x: week * TOTAL,
          y: day * TOTAL,
          date: key,
          count,
          scores,
          level: getLevel(count),
          display: d.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          }),
        });

        // month labels on the first row
        if (day === 0) {
          const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
          if (!seenMonths.has(monthKey)) {
            seenMonths.add(monthKey);
            monthLabels.push({
              x: week * TOTAL,
              label: MONTHS[d.getMonth()],
            });
          }
        }
      }
    }

    return { cells, monthLabels };
  }, [data]);

  const svgWidth = WEEKS * TOTAL;
  const svgHeight = DAYS * TOTAL + 20; // +20 for month labels

  return (
    <div className="pp-heatmap">
      <div className="pp-heatmap__scroll">
        <svg
          width={svgWidth}
          height={svgHeight}
          className="pp-heatmap__svg"
          role="img"
          aria-label="Activity heatmap"
        >
          {/* Month labels */}
          {monthLabels.map((m, i) => (
            <text
              key={i}
              x={m.x}
              y={12}
              className="pp-heatmap__month"
            >
              {m.label}
            </text>
          ))}

          {/* Day cells */}
          {cells.map((cell) => (
            <rect
              key={cell.date}
              x={cell.x}
              y={cell.y + 18}
              width={CELL}
              height={CELL}
              rx={2}
              className={`pp-heatmap__cell pp-heatmap__cell--l${cell.level}`}
              onMouseEnter={() => setHoveredCell(cell)}
              onMouseLeave={() => setHoveredCell(null)}
            />
          ))}
        </svg>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div className="pp-heatmap__tip">
          <strong>{hoveredCell.count} test{hoveredCell.count !== 1 ? "s" : ""}</strong>
          {" on "}
          {hoveredCell.display}
          {hoveredCell.scores.length > 0 && (
            <span className="pp-heatmap__tip-scores">
              {" — "}Scores: {hoveredCell.scores.join(", ")}%
            </span>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="pp-heatmap__legend">
        <span className="pp-heatmap__legend-label">Less</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className={`pp-heatmap__legend-cell pp-heatmap__cell--l${l}`} />
        ))}
        <span className="pp-heatmap__legend-label">More</span>
      </div>
    </div>
  );
}
