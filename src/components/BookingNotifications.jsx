import React from "react";
import "./BookingNotifications.css";

export default function BookingNotifications({ notifications, onDismiss }) {
  if (!notifications.length) return null;

  return (
    <div className="booking-toast-stack">
      {notifications.map((n) => (
        <div key={n.id} className="booking-toast">
          <span className="booking-toast-dot" aria-hidden="true" />
          <span className="booking-toast-text">{n.message}</span>
          <button
            type="button"
            className="booking-toast-close"
            onClick={() => onDismiss(n.id)}
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
}

