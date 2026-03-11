export function parseAnalyticsRows(data) {
  return data
    .map((row) => {
      const endDate = new Date(row.end_time);
      return {
        ...row,
        endDate,
        rawSeconds: Number(row.duration_played || 0),
        amountPaid: Number(row.amount_paid || 0),
      };
    })
    .filter((row) => row.endDate instanceof Date && !isNaN(row.endDate.getTime()));
}

export function groupRowsByMonth(parsedData) {
  const monthlyData = {};
  parsedData.forEach((row) => {
    const monthKey = `${row.endDate.getFullYear()}-${String(
      row.endDate.getMonth() + 1
    ).padStart(2, "0")}`;
    if (!monthlyData[monthKey]) monthlyData[monthKey] = [];
    monthlyData[monthKey].push(row);
  });
  return monthlyData;
}

export function buildDayUsageData(rows) {
  const dayLabels = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const dayCounts = Array(7).fill(0);
  rows.forEach((row) => {
    const jsDay = row.endDate.getDay();
    const mondayFirstIndex = (jsDay + 6) % 7;
    dayCounts[mondayFirstIndex] += row.rawSeconds;
  });

  return {
    labels: dayLabels,
    datasets: [
      {
        label: "Total Play Time (hours)",
        data: dayCounts.map((s) => (s / 3600).toFixed(2)),
        backgroundColor: "rgba(75, 192, 192, 0.7)",
      },
    ],
  };
}

export function buildHourUsageData(rows) {
  const workingHours = [
    ...Array.from({ length: 12 }, (_, i) => `${i + 12}:00`),
    "0:00",
  ];
  const hourCounts = Array(24).fill(0);
  rows.forEach((row) => {
    hourCounts[row.endDate.getHours()] += row.rawSeconds;
  });
  const workingHourCounts = [...hourCounts.slice(12, 24), ...hourCounts.slice(0, 1)];

  return {
    labels: workingHours,
    datasets: [
      {
        label: "Play Time (hours)",
        data: workingHourCounts.map((s) => (s / 3600).toFixed(2)),
        backgroundColor: "rgba(153, 102, 255, 0.7)",
      },
    ],
  };
}

export function buildTableUsageData(rows) {
  const tableCounts = {};
  rows.forEach((row) => {
    const table = row.table_name;
    tableCounts[table] = (tableCounts[table] || 0) + row.rawSeconds;
  });

  return {
    labels: Object.keys(tableCounts),
    datasets: [
      {
        label: "Total Play Time (hours)",
        data: Object.values(tableCounts).map((s) => (s / 3600).toFixed(2)),
        backgroundColor: "rgba(255, 159, 64, 0.7)",
      },
    ],
  };
}

export function getAverageDurationMinutes(rows) {
  return rows.reduce((sum, r) => sum + r.rawSeconds, 0) / rows.length / 60;
}

