import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ReadingsChart({
  title,
  data,
  dataKey,
  color = "var(--color-secondary)",
  unit = "",
}) {
  const formatted = (data || []).map((item) => ({
    ...item,
    label: formatEpoch(item.epoch),
  }));

  return (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>

      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <LineChart data={formatted}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" hide />
            <YAxis />
            <Tooltip
              formatter={(value) => [`${value} ${unit}`, title]}
              labelFormatter={(label) => `Fecha: ${label}`}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function formatEpoch(epoch) {
  if (!epoch) return "-";
  return new Date(epoch * 1000).toLocaleString();
}