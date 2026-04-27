// src/App.jsx
import React, { useState, useEffect, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import StartModal from "./components/StartModal";
import AnalyticsPage from "./pages/AnalyticsPage";
import SalesSettingsPage from "./pages/SalesSettingsPage";
import MenuAdminPage from "./pages/MenuAdminPage";
import BookingsPage from "./pages/BookingsPage";
import TableViewPage from "./pages/TableViewPage";
import "./pages/MenuAdminPage.css";
import GlobalSoundButtons from "./components/GlobalSoundButtons";
import HomeDashboard from "./components/HomeDashboard";
import BookingNotifications from "./components/BookingNotifications";
import HeaderNav from "./components/HeaderNav";
import useCart from "./hooks/useCart";
import useTables from "./hooks/useTables";
import useBookingNotifications from "./hooks/useBookingNotifications";
import useActiveBookingsCount from "./hooks/useActiveBookingsCount";
import { playTableEndSound } from "./utils/utils";
import "./App.css";
import "./components/BookingNotifications.css";
// App.jsx
import { HOURLY_RATE, LOCAL_STORAGE_TABLES_KEY, LOCAL_STORAGE_HISTORY_KEY } from './config';

function App() {
  const [_, setTick] = useState(0); // To force re-render for running timers
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { notifications, dismissNotification } = useBookingNotifications();
  const activeBookingsCount = useActiveBookingsCount();
  const { cart, addToCart, incrementQuantity, decrementQuantity, removeItem, calculateTotal, handleSubmit } = useCart();
  const { 
    tables, 
    setTables, 
    sessionHistory, 
    showModalForTableId,  
    openStartModal, 
    closeStartModal, 
    handleToggleAvailability, 
    handleStartTimer, 
    handleStopTimer, 
    handlePayAndClear, 
    handleTransferTimer
  } = useTables();

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };
  
  // Interval to update running timers and check for countdown completion
  useEffect(() => {
    const intervalId = setInterval(() => {
      let needsVisualUpdate = false;

      setTables((prevTables) => {
        let tableStateChangedDueToCountdown = false;

        const newTables = prevTables.map((table) => {
          if (!table.isRunning) return table;

          needsVisualUpdate = true;
          if (
            table.timerMode === "countdown" &&
            table.initialCountdownSeconds &&
            table.timerStartTime
          ) {
            const elapsedSinceStart = (Date.now() - table.timerStartTime) / 1000;
            const totalPassedTime = table.elapsedTimeInSeconds + elapsedSinceStart;

            if (totalPassedTime >= table.initialCountdownSeconds) {
              playTableEndSound(table.id, table.gameType);
              tableStateChangedDueToCountdown = true;
              return {
                ...table,
                isRunning: false,
                elapsedTimeInSeconds: table.initialCountdownSeconds,
                timerStartTime: null,
              };
            }
          }
          return table;
        });

        return tableStateChangedDueToCountdown ? newTables : prevTables;
      });

      if (needsVisualUpdate) {
        setTick((prevTick) => prevTick + 1);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [setTables]);

  // Save tables to local storage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_TABLES_KEY, JSON.stringify(tables));
    } catch (e) {
      console.error("Tables Effect: Error saving tables to localStorage:", e);
    }
  }, [tables]);

  // Save history to local storage
  useEffect(() => {
    console.log(
      "SessionHistory Effect: Attempting to save history. Current state:",
      sessionHistory
    );
    try {
      localStorage.setItem(
        LOCAL_STORAGE_HISTORY_KEY,
        JSON.stringify(sessionHistory)
      );
      console.log(
        "SessionHistory Effect: Successfully saved to localStorage. Key:",
        LOCAL_STORAGE_HISTORY_KEY
      );
    } catch (e) {
      console.error(
        "SessionHistory Effect: Error saving history to localStorage:",
        e
      );
    }
  }, [sessionHistory]);

  const tableForModal = tables.find((t) => t.id === showModalForTableId);

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <Link className="logo" to=''>
            <h1>
              <img src="/matchpoint-logo.png" alt="MatchPoint logo" className="header-logo-image" />
              MatchPoint Table Manager
            </h1>
          </Link>
          <HeaderNav
            activeBookingsCount={activeBookingsCount}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={toggleSidebar}
          />
        </header>
        <main className="main-content">
          <BookingNotifications notifications={notifications} onDismiss={dismissNotification} />
          <GlobalSoundButtons />
          <Routes>
            <Route
              path="/"
              element={
                <HomeDashboard
                  tables={tables}
                  openStartModal={openStartModal}
                  handleStopTimer={handleStopTimer}
                  handlePayAndClear={handlePayAndClear}
                  handleToggleAvailability={handleToggleAvailability}
                  handleTransferTimer={handleTransferTimer}
                  isSidebarOpen={isSidebarOpen}
                  cart={cart}
                  incrementQuantity={incrementQuantity}
                  decrementQuantity={decrementQuantity}
                  removeItem={removeItem}
                  calculateTotal={calculateTotal}
                  handleSubmit={handleSubmit}
                  addToCart={addToCart}
                  toggleSidebar={toggleSidebar}
                  sessionHistory={sessionHistory}
                />
              }
            />
            <Route
              path="/analytics"
              element={
                <Suspense fallback={<div>Loading Analytics..</div>}>
                  <AnalyticsPage />
                </Suspense>
              }
            />
            <Route path="/admin/sales" element={<SalesSettingsPage />} />
            <Route path="/admin/menu" element={<MenuAdminPage />} />
            <Route path="/admin/bookings" element={<BookingsPage />} />
            <Route path="/table-view" element={<TableViewPage tables={tables} />} />
          </Routes>
        </main>
        {tableForModal && (
          <StartModal
            table={tableForModal}
            isOpen={!!showModalForTableId}
            onClose={closeStartModal}
            onStart={handleStartTimer}
          />
        )}
        <footer className="app-footer">
          <p>Hourly Rate: {HOURLY_RATE} GEL</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
