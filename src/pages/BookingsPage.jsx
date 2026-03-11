import React, { useEffect, useState } from "react";
import BookingForm from "../components/bookings/BookingForm";
import BookingList from "../components/bookings/BookingList";
import {
  createBooking,
  deleteBooking,
  fetchBookings,
  markBookingAsDone,
  subscribeToBookingsChanges,
} from "../services/supabaseData";
import "./BookingsPage.css";

export default function BookingsPage() {
  const [bookingName, setBookingName] = useState("");
  const [tablesCount, setTablesCount] = useState("");
  const [hoursCount, setHoursCount] = useState("");
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setIsLoading(true);
        const rows = await fetchBookings();
        setBookings(rows);
      } catch (error) {
        console.error("Failed to load bookings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadBookings();

    const unsubscribe = subscribeToBookingsChanges((payload) => {
      const { eventType, new: newBooking, old: oldBooking } = payload;
      if (eventType === "INSERT" && newBooking && !newBooking.is_done) {
        setBookings((prev) => {
          if (prev.some((b) => b.id === newBooking.id)) return prev;
          return [newBooking, ...prev];
        });
      }
      if (eventType === "UPDATE" && newBooking) {
        if (newBooking.is_done) {
          setBookings((prev) => prev.filter((b) => b.id !== newBooking.id));
        } else {
          setBookings((prev) =>
            prev.map((b) => (b.id === newBooking.id ? newBooking : b))
          );
        }
      }
      if (eventType === "DELETE" && oldBooking) {
        setBookings((prev) => prev.filter((b) => b.id !== oldBooking.id));
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const created = await createBooking({
        customerName: bookingName.trim(),
        tablesCount: Number(tablesCount),
        hoursCount: Number(hoursCount),
      });
      setBookings((prev) => {
        if (prev.some((b) => b.id === created.id)) return prev;
        return [created, ...prev];
      });
      setBookingName("");
      setTablesCount("");
      setHoursCount("");
    } catch (error) {
      console.error("Failed to create booking:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkDone = async (id) => {
    try {
      await markBookingAsDone(id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (error) {
      console.error("Failed to mark booking as done:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteBooking(id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (error) {
      console.error("Failed to delete booking:", error);
    }
  };

  return (
    <div className="bookings-page">
      <h1>Bookings</h1>
      <BookingForm
        bookingName={bookingName}
        setBookingName={setBookingName}
        tablesCount={tablesCount}
        setTablesCount={setTablesCount}
        hoursCount={hoursCount}
        setHoursCount={setHoursCount}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
      <BookingList
        bookings={bookings}
        isLoading={isLoading}
        onMarkDone={handleMarkDone}
        onDelete={handleDelete}
      />
    </div>
  );
}

