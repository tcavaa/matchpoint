import React from "react";

export default function TableRatesList({
  tables,
  tableRates,
  defaultHourlyRate,
  defaultSaleHourlyRate,
  onToggle,
  onChange,
}) {
  return (
    <ul className="rate-table-list">
      {tables.map((table) => {
        const customRates = tableRates[table.id];
        return (
          <li
            key={table.id}
            className={`rate-table-row ${customRates ? "is-custom" : ""}`}
          >
            <label className="rate-table-toggle">
              <input
                type="checkbox"
                checked={Boolean(customRates)}
                onChange={(e) => onToggle(table.id, e.target.checked)}
              />
              {table.name}
            </label>
            {customRates ? (
              <div className="rate-table-inputs">
                <label className="rate-table-input">
                  Regular
                  <input
                    className="settings-input"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    required
                    aria-label={`${table.name} regular rate (GEL/hr)`}
                    value={customRates.hourlyRate}
                    onChange={(e) => onChange(table.id, "hourlyRate", e.target.value)}
                  />
                </label>
                <label className="rate-table-input">
                  Sale
                  <input
                    className="settings-input"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    required
                    aria-label={`${table.name} sale rate (GEL/hr)`}
                    value={customRates.saleHourlyRate}
                    onChange={(e) => onChange(table.id, "saleHourlyRate", e.target.value)}
                  />
                </label>
                <span className="rate-table-unit">GEL/hr</span>
              </div>
            ) : (
              <span className="rate-table-default">
                Default: {defaultHourlyRate || "–"} GEL/hr, sale {defaultSaleHourlyRate || "–"} GEL/hr
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
