import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { fetchSessionHistoryForAnalytics } from "../services/supabaseData";
import {
  parseAnalyticsRows,
  groupRowsByMonth,
} from "../utils/analyticsCharts";
import MonthlyAnalyticsSection from "./analytics/MonthlyAnalyticsSection";

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

export default function Analytics() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const rows = await fetchSessionHistoryForAnalytics();
        setData(rows);
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

  const parsedData = parseAnalyticsRows(data);
  const monthlyData = groupRowsByMonth(parsedData);

  return (
    <div style={{ padding: "20px" }}>
      <h2>📊 Monthly Analytics</h2>

      {Object.entries(monthlyData)
        .sort(([a], [b]) => b.localeCompare(a)) // sort descending: latest month first
        .map(([monthKey, rows]) => (
          <MonthlyAnalyticsSection key={monthKey} monthKey={monthKey} rows={rows} />
        ))}
    </div>
  );
}
