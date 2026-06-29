import { useEffect, useState } from "react";
import { subscribeToBookingInserts } from "../services/supabaseData";
import { getActiveBranch } from "../branches";

export default function useBookingNotifications(branch = getActiveBranch()) {
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
    }, branch);

    return () => unsubscribe();
  }, [branch]);

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return { notifications, dismissNotification };
}

