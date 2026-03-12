import React from "react";

export default function BookingForm({
  bookingName,
  setBookingName,
  tablesCount,
  setTablesCount,
  hoursCount,
  setHoursCount,
  bookingDateTime,
  setBookingDateTime,
  onSubmit,
  isSubmitting,
}) {
  return (
    <div className="booking-card">
      <h2>Add Booking</h2>
      <form onSubmit={onSubmit} className="booking-form">
        <input
          type="text"
          value={bookingName}
          onChange={(e) => setBookingName(e.target.value)}
          placeholder="Customer Name"
          required
        />
        <input
          type="number"
          min="1"
          value={tablesCount}
          onChange={(e) => setTablesCount(e.target.value)}
          placeholder="Number of Tables"
          required
        />
        <input
          type="number"
          min="1"
          step="0.5"
          value={hoursCount}
          onChange={(e) => setHoursCount(e.target.value)}
          placeholder="Number of Hours"
          required
        />
        <input
          type="datetime-local"
          value={bookingDateTime}
          onChange={(e) => setBookingDateTime(e.target.value)}
          required
        />
        <button className="admin-btn admin-btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting && <span className="btn-spinner" aria-hidden="true" />}
          {isSubmitting ? "Saving..." : "Create Booking"}
        </button>
      </form>
    </div>
  );
}

