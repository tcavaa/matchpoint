import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { APPS_SCRIPT_WEB_APP_URL } from "../config";

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

export default function Analytics() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${APPS_SCRIPT_WEB_APP_URL}?type=fetchAll`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Error fetching analytics data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <p>Loading analytics...</p>;
  if (!data.length) return <p>No data found for analytics.</p>;

  // Parse data with Date objects and numeric fields
  const parsedData = data.map((row) => ({
    ...row,
    endDate: new Date(row["End Time"]),
    rawSeconds: Number(row["Raw Duration"] || 0),
    amountPaid: Number(row["Amount Paid"] || 0),
  }));

  // Group data by month-year
  const monthlyData = {};
  parsedData.forEach((row) => {
    const monthKey = `${row.endDate.getFullYear()}-${String(row.endDate.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyData[monthKey]) monthlyData[monthKey] = [];
    monthlyData[monthKey].push(row);
  });

  const dayLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const workingHours = [...Array.from({ length: 6 }, (_, i) => `${i + 18}:00`), "0:00"];

  return (
    <div style={{ padding: "20px" }}>
      <h2>📊 Monthly Analytics</h2>

      {Object.entries(monthlyData)
        .sort(([a], [b]) => b.localeCompare(a)) // sort descending: latest month first
        .map(([monthKey, rows]) => {
        // Day of Week Usage
        const dayCounts = Array(7).fill(0);
        rows.forEach((row) => {
          dayCounts[row.endDate.getDay()] += row.rawSeconds;
        });

        const dayUsageData = {
          labels: dayLabels,
          datasets: [
            {
              label: "Total Play Time (hours)",
              data: dayCounts.map((s) => (s / 3600).toFixed(2)),
              backgroundColor: "rgba(75, 192, 192, 0.7)",
            },
          ],
        };

        // Hour of Day Usage (18:00–23:00 + 0:00–1:00)
        const hourCounts = Array(24).fill(0);
        rows.forEach((row) => {
          hourCounts[row.endDate.getHours()] += row.rawSeconds;
        });

        const workingHourCounts = [
          ...hourCounts.slice(18, 24), // 18:00–23:00
          ...hourCounts.slice(0, 2)    // 0:00–1:00
        ];

        const hourUsageData = {
          labels: workingHours,
          datasets: [
            {
              label: "Play Time (hours)",
              data: workingHourCounts.map((s) => (s / 3600).toFixed(2)),
              backgroundColor: "rgba(153, 102, 255, 0.7)",
            },
          ],
        };

        // Most Used Tables
        const tableCounts = {};
        rows.forEach((row) => {
          const table = row["Table Name"];
          tableCounts[table] = (tableCounts[table] || 0) + row.rawSeconds;
        });

        const tableUsageData = {
          labels: Object.keys(tableCounts),
          datasets: [
            {
              label: "Total Play Time (hours)",
              data: Object.values(tableCounts).map((s) => (s / 3600).toFixed(2)),
              backgroundColor: "rgba(255, 159, 64, 0.7)",
            },
          ],
        };

        // Average session duration
        const avgDuration =
          rows.reduce((sum, r) => sum + r.rawSeconds, 0) / rows.length / 60;

        // Month label like "2025-08" -> "August 2025"
        const monthLabel = new Date(monthKey + "-01").toLocaleString("default", {
          month: "long",
          year: "numeric",
        });

        return (
          <div key={monthKey} style={{ marginBottom: "60px" }}>
            <h3>{monthLabel}</h3>
            <p>Average session duration: {avgDuration.toFixed(1)} minutes</p>

            <div style={{ marginBottom: "40px" }}>
              <h4>Day of Week Usage</h4>
              <Bar data={dayUsageData} />
            </div>

            <div style={{ marginBottom: "40px" }}>
              <h4>Hour of Day Usage</h4>
              <Bar data={hourUsageData} />
            </div>

            <div style={{ marginBottom: "40px" }}>
              <h4>Most Used Tables</h4>
              <Bar data={tableUsageData} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
