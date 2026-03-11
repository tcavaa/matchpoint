import { useEffect, useState } from "react";
import { subscribeToBookingInserts } from "../services/supabaseData";

export default function useBookingNotifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToBookingInserts((booking) => {
      if (booking.is_done) return;
      const next = {
        id: `${booking.id}-${Date.now()}`,
        message: `New booking: ${booking.customer_name} (${booking.tables_count} table(s), ${booking.hours_count} hour(s))`,
      };
      setNotifications((prev) => [next, ...prev].slice(0, 4));

      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== next.id));
      }, 6000);
    });

    return () => unsubscribe();
  }, []);

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return { notifications, dismissNotification };
}

