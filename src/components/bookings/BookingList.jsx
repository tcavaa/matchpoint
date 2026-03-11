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
      {bookings.map((booking) => (
        <div className="booking-row" key={booking.id}>
          <div className="booking-name">{booking.customer_name}</div>
          <div className="booking-meta">
            {booking.tables_count} table(s) • {booking.hours_count} hour(s)
          </div>
          <div className="booking-time">
            {new Date(booking.created_at).toLocaleString()}
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
      ))}
    </div>
  );
}

