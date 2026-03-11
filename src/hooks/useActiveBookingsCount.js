import { useEffect, useState } from "react";
import { fetchActiveBookingsCount, subscribeToBookingsChanges } from "../services/supabaseData";

export default function useActiveBookingsCount() {
  const [activeBookingsCount, setActiveBookingsCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const refreshCount = async () => {
      try {
        const count = await fetchActiveBookingsCount();
        if (mounted) setActiveBookingsCount(count);
      } catch (error) {
        console.error("Failed to fetch active bookings count:", error);
      }
    };

    refreshCount();
    const unsubscribe = subscribeToBookingsChanges(() => {
      refreshCount();
    });
    const onLocalBookingsChanged = () => {
      refreshCount();
    };
    const onWindowFocus = () => {
      refreshCount();
    };

    window.addEventListener("bookings:changed", onLocalBookingsChanged);
    window.addEventListener("focus", onWindowFocus);
    const intervalId = window.setInterval(refreshCount, 5000);

    return () => {
      mounted = false;
      unsubscribe();
      window.removeEventListener("bookings:changed", onLocalBookingsChanged);
      window.removeEventListener("focus", onWindowFocus);
      window.clearInterval(intervalId);
    };
  }, []);

  return activeBookingsCount;
}

