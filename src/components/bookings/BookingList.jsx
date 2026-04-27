import React from "react";

export default function BookingList({ bookings, isLoading, onMarkDone, onDelete }) {
  return (
    <div className="booking-card">
      <h2>Current Bookings</h2>
      {isLoading && (
        <div className="menu-items-loading">
          <span className="btn-spinner" aria-hidden="true" />
          <span>Loading bookings...</span>
        </div>
      )}
      {!isLoading && bookings.length === 0 && (
        <p className="booking-empty">No bookings yet.</p>
      )}
      {[...bookings]
        .sort(
          (a, b) =>
            new Date(a.booking_at || a.created_at) -
            new Date(b.booking_at || b.created_at)
        )
        .map((booking) => {
          const tableIds = Array.isArray(booking.table_ids) ? booking.table_ids : [];
          const tablesLabel =
            tableIds.length > 0
              ? `Table${tableIds.length > 1 ? "s" : ""} ${tableIds
                  .slice()
                  .sort((a, b) => a - b)
                  .join(", ")}`
              : `${booking.tables_count} table(s)`;
          return (
            <div className="booking-row" key={booking.id}>
              <div className="booking-name">{booking.customer_name}</div>
              <div className="booking-meta">
                {tablesLabel}
                {booking.hours_count ? ` • ${booking.hours_count} hour(s)` : ""}
              </div>
              <div className="booking-time">
                <strong>
                  {new Date(booking.booking_at || booking.created_at).toLocaleString()}
                </strong>
              </div>
              <div className="booking-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn-primary booking-action-btn"
                  onClick={() => onMarkDone(booking.id)}
                >
                  Done
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-danger booking-action-btn"
                  onClick={() => onDelete(booking.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
    </div>
  );
}
