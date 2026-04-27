import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchBookings,
  subscribeToBookingsChanges,
  createBooking,
  updateBooking,
  deleteBooking,
} from "../services/supabaseData";
import TableViewBookingModal from "../components/table-view/TableViewBookingModal";
import "./TableViewPage.css";

const DRAG_THRESHOLD_PX = 5;

const PING_PONG_TABLE_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const DAY_START_HOUR = 15;
const DAY_END_HOUR = 24;
const HOUR_HEIGHT_PX = 64;
const COUNT_UP_PREDICTION_MS = 1.5 * 60 * 60 * 1000;

function formatHourLabel(hour24) {
  const normalized = ((hour24 % 24) + 24) % 24;
  if (normalized === 0) return "12 AM";
  if (normalized === 12) return "12 PM";
  if (normalized < 12) return `${normalized} AM`;
  return `${normalized - 12} PM`;
}

function formatRangeLabel(startMs, endMs) {
  const start = new Date(startMs);
  const end = new Date(endMs);
  const fmt = (d) =>
    d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).toLowerCase();
  return `${fmt(start)} – ${fmt(end)}`;
}

function buildLocalDateTimeInput(date, hour, minute = 0) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(hour).padStart(2, "0");
  const mi = String(minute).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function buildLocalDateTimeInputFromMs(ms) {
  const d = new Date(ms);
  return buildLocalDateTimeInput(d, d.getHours(), d.getMinutes());
}

function parseHourFromMs(ms, dayStart) {
  const dayMs = new Date(
    dayStart.getFullYear(),
    dayStart.getMonth(),
    dayStart.getDate()
  ).getTime();
  return (ms - dayMs) / (60 * 60 * 1000);
}

function isSameLocalDay(aMs, bDate) {
  const a = new Date(aMs);
  return (
    a.getFullYear() === bDate.getFullYear() &&
    a.getMonth() === bDate.getMonth() &&
    a.getDate() === bDate.getDate()
  );
}

export default function TableViewPage({ tables = [] }) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [bookings, setBookings] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [modalState, setModalState] = useState(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [draggingState, setDraggingState] = useState(null);
  const gridBodyRef = useRef(null);
  const columnsRef = useRef(null);
  const dragStartRef = useRef(null);
  const recentDragEndRef = useRef(0);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const rows = await fetchBookings();
        setBookings(rows);
      } catch (error) {
        console.error("Failed to load bookings for table view:", error);
      }
    };
    load();

    const unsubscribe = subscribeToBookingsChanges((payload) => {
      const { eventType, new: newBooking, old: oldBooking } = payload;
      if (eventType === "INSERT" && newBooking) {
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

  const isViewingToday = useMemo(() => {
    return isSameLocalDay(now, selectedDate);
  }, [now, selectedDate]);

  const liveTimerBlocks = useMemo(() => {
    if (!isViewingToday) return [];
    const blocks = [];
    tables.forEach((table) => {
      if (table.gameType !== "pingpong") return;
      const hasActivity =
        table.isRunning ||
        (table.elapsedTimeInSeconds || 0) > 0 ||
        (table.timerMode === "countdown" && (table.initialCountdownSeconds || 0) > 0);
      if (!hasActivity) return;

      const startMs = table.sessionStartTime || null;
      if (!startMs) return;

      const isCountdown =
        table.timerMode === "countdown" && !!table.initialCountdownSeconds;
      const isCountUp = !isCountdown;
      let endMs;
      let isPredicted = false;

      if (isCountdown) {
        endMs = startMs + table.initialCountdownSeconds * 1000;
      } else if (table.isRunning) {
        const projected = startMs + COUNT_UP_PREDICTION_MS;
        endMs = Math.max(projected, now);
        isPredicted = true;
      } else {
        endMs = table.sessionEndTime || startMs + (table.elapsedTimeInSeconds || 0) * 1000;
      }

      if (!isSameLocalDay(startMs, selectedDate)) return;
      if (endMs <= startMs) return;

      blocks.push({
        id: `live-${table.id}`,
        tableId: table.id,
        startMs,
        endMs,
        title: table.name || `Table ${table.id}`,
        kind: "live",
        isRunning: table.isRunning,
        isCountUp,
        isPredicted,
      });
    });
    return blocks;
  }, [tables, now, selectedDate, isViewingToday]);

  const bookingBlocks = useMemo(() => {
    const blocks = [];
    bookings.forEach((booking) => {
      const startMs = booking.booking_at
        ? new Date(booking.booking_at).getTime()
        : booking.created_at
        ? new Date(booking.created_at).getTime()
        : null;
      if (!startMs) return;
      if (!isSameLocalDay(startMs, selectedDate)) return;

      const durationMs =
        (booking.hours_count && Number(booking.hours_count) > 0
          ? Number(booking.hours_count)
          : 1) * 60 * 60 * 1000;
      const endMs = startMs + durationMs;

      const tableIds =
        Array.isArray(booking.table_ids) && booking.table_ids.length > 0
          ? booking.table_ids
          : [];

      if (tableIds.length === 0) return;

      tableIds.forEach((tableId) => {
        if (!PING_PONG_TABLE_IDS.includes(Number(tableId))) return;
        blocks.push({
          id: `booking-${booking.id}-t${tableId}`,
          tableId: Number(tableId),
          startMs,
          endMs,
          title: booking.customer_name || "Booking",
          kind: "booking",
          bookingId: booking.id,
          booking,
        });
      });
    });
    return blocks;
  }, [bookings, selectedDate]);

  const blocksByTable = useMemo(() => {
    const grouped = new Map();
    PING_PONG_TABLE_IDS.forEach((id) => grouped.set(id, []));
    [...liveTimerBlocks, ...bookingBlocks].forEach((block) => {
      const isDraggingThis =
        draggingState && draggingState.block && draggingState.block.id === block.id;
      let displayBlock = block;
      let displayTableId = block.tableId;

      if (isDraggingThis) {
        displayTableId = draggingState.currentTableId;
        displayBlock = {
          ...block,
          startMs: draggingState.currentStartMs,
          endMs: draggingState.currentStartMs + draggingState.durationMs,
          isDragging: true,
        };
      }

      if (!grouped.has(displayTableId)) return;
      grouped.get(displayTableId).push(displayBlock);
    });
    return grouped;
  }, [liveTimerBlocks, bookingBlocks, draggingState]);

  const totalHours = DAY_END_HOUR - DAY_START_HOUR;

  const computeBlockStyle = (block) => {
    const startHour = parseHourFromMs(block.startMs, selectedDate);
    const endHour = parseHourFromMs(block.endMs, selectedDate);
    const top = Math.max(0, (startHour - DAY_START_HOUR) * HOUR_HEIGHT_PX);
    const bottom = Math.min(
      totalHours * HOUR_HEIGHT_PX,
      (endHour - DAY_START_HOUR) * HOUR_HEIGHT_PX
    );
    const height = Math.max(20, bottom - top);
    return { top, height };
  };

  const computeNowLineTop = () => {
    if (!isViewingToday) return null;
    const hour = new Date(now).getHours() + new Date(now).getMinutes() / 60;
    if (hour < DAY_START_HOUR || hour > DAY_END_HOUR) return null;
    return (hour - DAY_START_HOUR) * HOUR_HEIGHT_PX;
  };

  const handleColumnClick = (e, tableId) => {
    if (Date.now() - recentDragEndRef.current < 250) return;
    if (e.target.closest(".table-view-block")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const totalHeight = totalHours * HOUR_HEIGHT_PX;
    const clampedY = Math.max(0, Math.min(totalHeight, offsetY));
    const hourFloat = DAY_START_HOUR + clampedY / HOUR_HEIGHT_PX;
    const hour = Math.min(
      DAY_END_HOUR - 1,
      Math.max(DAY_START_HOUR, Math.floor(hourFloat))
    );

    setModalState({
      mode: "create",
      bookingDateTime: buildLocalDateTimeInput(selectedDate, hour, 0),
      tableIds: [tableId],
      bookingName: "",
      hoursCount: "1",
    });
  };

  const openEditModal = useCallback((block) => {
    if (block.kind !== "booking") return;
    const booking = block.booking;
    if (!booking) return;
    setModalState({
      mode: "edit",
      bookingId: booking.id,
      bookingDateTime: booking.booking_at
        ? buildLocalDateTimeInputFromMs(new Date(booking.booking_at).getTime())
        : "",
      tableIds: Array.isArray(booking.table_ids) ? [...booking.table_ids] : [],
      bookingName: booking.customer_name || "",
      hoursCount:
        booking.hours_count !== null && booking.hours_count !== undefined
          ? String(booking.hours_count)
          : "",
    });
  }, []);

  const handleBlockPointerDown = (block, e) => {
    if (block.kind !== "booking") return;
    if (e.button !== undefined && e.button !== 0) return;
    e.stopPropagation();
    dragStartRef.current = {
      block,
      startX: e.clientX,
      startY: e.clientY,
      pointerId: e.pointerId,
      started: false,
    };
  };

  const commitDrag = useCallback((state) => {
    const { block, currentTableId, currentStartMs } = state;
    const originalTableId = block.tableId;
    const originalStartMs = block.startMs;

    if (currentTableId === originalTableId && currentStartMs === originalStartMs) {
      return;
    }

    const booking = block.booking;
    if (!booking) return;

    const existingIds = Array.isArray(booking.table_ids) ? booking.table_ids : [];
    const newTableIds = Array.from(
      new Set(
        existingIds.map((id) =>
          Number(id) === Number(originalTableId) ? Number(currentTableId) : Number(id)
        )
      )
    ).sort((a, b) => a - b);

    const newBookingAt = new Date(currentStartMs).toISOString();
    const previousBooking = booking;

    setBookings((prev) =>
      prev.map((b) =>
        b.id === booking.id
          ? { ...b, booking_at: newBookingAt, table_ids: newTableIds }
          : b
      )
    );

    updateBooking(booking.id, {
      bookingAt: newBookingAt,
      tableIds: newTableIds,
    }).catch((error) => {
      console.error("Failed to update booking via drag:", error);
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? previousBooking : b))
      );
    });
  }, []);

  useEffect(() => {
    const computeDragPosition = (clientX, clientY) => {
      const columnsEl = columnsRef.current;
      if (!columnsEl) return null;
      const rect = columnsEl.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;

      const colWidth = rect.width / PING_PONG_TABLE_IDS.length;
      const x = Math.max(0, Math.min(rect.width - 1, clientX - rect.left));
      const colIndex = Math.max(
        0,
        Math.min(PING_PONG_TABLE_IDS.length - 1, Math.floor(x / colWidth))
      );
      const tableId = PING_PONG_TABLE_IDS[colIndex];

      const y = Math.max(0, Math.min(rect.height - 1, clientY - rect.top));
      const hourFloat = DAY_START_HOUR + y / HOUR_HEIGHT_PX;
      const hour = Math.max(
        DAY_START_HOUR,
        Math.min(DAY_END_HOUR - 1, Math.floor(hourFloat))
      );

      const newDate = new Date(selectedDate);
      newDate.setHours(hour, 0, 0, 0);
      return { tableId, startMs: newDate.getTime() };
    };

    const handlePointerMove = (e) => {
      const dragInfo = dragStartRef.current;
      if (!dragInfo) return;

      const dx = e.clientX - dragInfo.startX;
      const dy = e.clientY - dragInfo.startY;

      if (!dragInfo.started) {
        if (Math.abs(dx) < DRAG_THRESHOLD_PX && Math.abs(dy) < DRAG_THRESHOLD_PX) {
          return;
        }
        dragInfo.started = true;
        const block = dragInfo.block;
        const initial =
          computeDragPosition(e.clientX, e.clientY) || {
            tableId: block.tableId,
            startMs: block.startMs,
          };
        setDraggingState({
          block,
          currentTableId: initial.tableId,
          currentStartMs: initial.startMs,
          durationMs: block.endMs - block.startMs,
        });
        e.preventDefault();
        return;
      }

      const pos = computeDragPosition(e.clientX, e.clientY);
      if (!pos) return;
      e.preventDefault();
      setDraggingState((prev) =>
        prev
          ? {
              ...prev,
              currentTableId: pos.tableId,
              currentStartMs: pos.startMs,
            }
          : null
      );
    };

    const handlePointerUp = () => {
      const dragInfo = dragStartRef.current;
      dragStartRef.current = null;

      if (!dragInfo) return;

      if (!dragInfo.started) {
        setDraggingState(null);
        openEditModal(dragInfo.block);
        return;
      }

      recentDragEndRef.current = Date.now();
      setDraggingState((prev) => {
        if (prev) commitDrag(prev);
        return null;
      });
    };

    const handlePointerCancel = () => {
      dragStartRef.current = null;
      setDraggingState(null);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [selectedDate, openEditModal, commitDrag]);

  const handleSubmitBooking = async (formState) => {
    if (isSubmittingBooking) return;
    try {
      setIsSubmittingBooking(true);
      if (modalState?.mode === "edit" && modalState.bookingId) {
        const updated = await updateBooking(modalState.bookingId, {
          customerName: formState.bookingName.trim(),
          hoursCount:
            formState.hoursCount === "" ? null : Number(formState.hoursCount),
          bookingAt: formState.bookingDateTime
            ? new Date(formState.bookingDateTime).toISOString()
            : null,
          tableIds: formState.tableIds,
        });
        setBookings((prev) =>
          prev.map((b) => (b.id === updated.id ? updated : b))
        );
      } else {
        const created = await createBooking({
          customerName: formState.bookingName.trim(),
          tablesCount: formState.tableIds.length || 1,
          hoursCount:
            formState.hoursCount === "" ? null : Number(formState.hoursCount),
          bookingAt: formState.bookingDateTime
            ? new Date(formState.bookingDateTime).toISOString()
            : null,
          tableIds: formState.tableIds,
        });
        setBookings((prev) => {
          if (prev.some((b) => b.id === created.id)) return prev;
          return [created, ...prev];
        });
      }
      setModalState(null);
    } catch (error) {
      console.error("Failed to save booking from table view:", error);
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleDeleteBooking = async () => {
    if (!modalState?.bookingId) return;
    if (isSubmittingBooking) return;
    try {
      setIsSubmittingBooking(true);
      await deleteBooking(modalState.bookingId);
      setBookings((prev) => prev.filter((b) => b.id !== modalState.bookingId));
      setModalState(null);
    } catch (error) {
      console.error("Failed to delete booking:", error);
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const goPrevDay = () => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - 1);
      return next;
    });
  };

  const goNextDay = () => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 1);
      return next;
    });
  };

  const goToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setSelectedDate(d);
  };

  const dateLabel = useMemo(() => {
    return selectedDate.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDate]);

  const nowLineTop = computeNowLineTop();

  return (
    <div className="table-view-page">
      <div className="table-view-toolbar">
        <div className="table-view-nav">
          <button className="admin-btn" type="button" onClick={goPrevDay}>
            ‹ Prev
          </button>
          <button className="admin-btn admin-btn-primary" type="button" onClick={goToday}>
            Today
          </button>
          <button className="admin-btn" type="button" onClick={goNextDay}>
            Next ›
          </button>
        </div>
        <div className="table-view-date">{dateLabel}</div>
      </div>

      <div className="table-view-grid">
        <div className="table-view-grid-header">
          <div className="table-view-time-col-header">GMT+04</div>
          {PING_PONG_TABLE_IDS.map((id) => {
            const liveTable = tables.find((t) => t.id === id);
            return (
              <div className="table-view-col-header" key={id}>
                <div className="table-view-col-header-label">
                  {liveTable?.name || `Table ${id}`}
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="table-view-grid-body"
          ref={gridBodyRef}
          style={{ height: totalHours * HOUR_HEIGHT_PX }}
        >
          <div
            className="table-view-time-col"
            style={{ height: totalHours * HOUR_HEIGHT_PX }}
          >
            {Array.from({ length: totalHours + 1 }).map((_, idx) => {
              const hour = DAY_START_HOUR + idx;
              const top = idx * HOUR_HEIGHT_PX;
              const isFirst = idx === 0;
              const isLast = idx === totalHours;
              const labelClass = `table-view-time-label${
                isFirst ? " is-first" : ""
              }${isLast ? " is-last" : ""}`;
              return (
                <div className={labelClass} key={hour} style={{ top }}>
                  {formatHourLabel(hour)}
                </div>
              );
            })}
          </div>

          <div className="table-view-columns" ref={columnsRef}>
            {PING_PONG_TABLE_IDS.map((tableId) => {
              const blocks = blocksByTable.get(tableId) || [];
              const isDropTarget =
                draggingState && draggingState.currentTableId === tableId;
              return (
                <div
                  className={`table-view-column ${
                    isDropTarget ? "is-drop-target" : ""
                  }`}
                  key={tableId}
                  onClick={(e) => handleColumnClick(e, tableId)}
                >
                  {Array.from({ length: totalHours }).map((_, idx) => (
                    <div
                      className="table-view-hour-slot"
                      key={idx}
                      style={{ height: HOUR_HEIGHT_PX }}
                    />
                  ))}
                  {blocks.map((block) => {
                    const { top, height } = computeBlockStyle(block);
                    const isDraggable = block.kind === "booking";
                    const className = [
                      "table-view-block",
                      block.kind === "live" ? "live" : "booking",
                      block.isRunning ? "running" : "",
                      block.isCountUp ? "countup" : "",
                      block.isPredicted ? "predicted" : "",
                      isDraggable ? "clickable" : "",
                      block.isDragging ? "dragging" : "",
                    ]
                      .filter(Boolean)
                      .join(" ");
                    return (
                      <div
                        key={block.id}
                        className={className}
                        style={{ top, height }}
                        title={`${block.title} • ${formatRangeLabel(
                          block.startMs,
                          block.endMs
                        )}${block.isPredicted ? " (projected 1.5h)" : ""}${
                          isDraggable ? " (drag to reschedule)" : ""
                        }`}
                        onPointerDown={
                          isDraggable
                            ? (e) => handleBlockPointerDown(block, e)
                            : undefined
                        }
                      >
                        <div className="table-view-block-title">{block.title}</div>
                        <div className="table-view-block-time">
                          {formatRangeLabel(block.startMs, block.endMs)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {nowLineTop !== null && (
            <div className="table-view-now-line" style={{ top: nowLineTop }}>
              <span className="table-view-now-dot" />
            </div>
          )}
        </div>
      </div>

      {modalState && (
        <TableViewBookingModal
          initialState={modalState}
          isSubmitting={isSubmittingBooking}
          isEditing={modalState.mode === "edit"}
          tableOptions={PING_PONG_TABLE_IDS}
          onSubmit={handleSubmitBooking}
          onDelete={modalState.mode === "edit" ? handleDeleteBooking : undefined}
          onClose={() => setModalState(null)}
        />
      )}
    </div>
  );
}
