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
  color = "#2563eb",
  unit = "",
}) {
  const formatted = (data || []).map((item) => ({
    ...item,
    label: formatEpoch(item.epoch),
  }));

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 18,
        padding: 18,
        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04)",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 16, color: "#0f172a" }}>{title}</h3>

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