// src/App.jsx
import React, { useState, useEffect, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import StartModal from "./components/StartModal";
import AnalyticsPage from "./pages/AnalyticsPage";
import RateSettingsPage from "./pages/RateSettingsPage";
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
import useRateSettings from "./hooks/useRateSettings";
import useBookingNotifications from "./hooks/useBookingNotifications";
import useActiveBookingsCount from "./hooks/useActiveBookingsCount";
import { playTableEndSound } from "./utils/utils";
import "./App.css";
import "./components/BookingNotifications.css";
// App.jsx
import { LOCAL_STORAGE_TABLES_KEY, LOCAL_STORAGE_HISTORY_KEY } from './config';
import {
  DEFAULT_BRANCH,
  resolveBranchFromPath,
  setActiveBranch,
  branchPrefix,
  branchStorageKey,
  getBranchConfig,
} from './branches';

// ─── Per-branch app body ──────────────────────────────────────────────
// Renders the whole manager for a single company branch. Remounted (via key)
// whenever the branch changes, so all branch-scoped state reinitializes.
function BranchApp({ branch }) {
  const basePath = branchPrefix(branch); // "" for main, "/dedaena" otherwise
  const homePath = basePath || "/";
  const branchConfig = getBranchConfig(branch);

  const [_, setTick] = useState(0); // To force re-render for running timers
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { notifications, dismissNotification } = useBookingNotifications(branch);
  const activeBookingsCount = useActiveBookingsCount(branch);
  const { cart, addToCart, incrementQuantity, decrementQuantity, removeItem, calculateTotal, handleSubmit } = useCart();
  const { rateSettings, saveRateSettings } = useRateSettings(branch);
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
  } = useTables(branch, rateSettings);

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

  // Save tables to local storage (branch-scoped key)
  useEffect(() => {
    try {
      localStorage.setItem(branchStorageKey(LOCAL_STORAGE_TABLES_KEY, branch), JSON.stringify(tables));
    } catch (e) {
      console.error("Tables Effect: Error saving tables to localStorage:", e);
    }
  }, [tables, branch]);

  // Save history to local storage (branch-scoped key)
  useEffect(() => {
    try {
      localStorage.setItem(
        branchStorageKey(LOCAL_STORAGE_HISTORY_KEY, branch),
        JSON.stringify(sessionHistory)
      );
    } catch (e) {
      console.error(
        "SessionHistory Effect: Error saving history to localStorage:",
        e
      );
    }
  }, [sessionHistory, branch]);

  const tableForModal = tables.find((t) => t.id === showModalForTableId);

  return (
    <div className="app">
      <header className="app-header">
        <Link className="logo" to={homePath}>
          <h1>
            <img src="/matchpoint-logo.png" alt="MatchPoint logo" className="header-logo-image" />
            MatchPoint Table Manager
            {branch !== DEFAULT_BRANCH && <span className="branch-tag"> · {branchConfig.label}</span>}
          </h1>
        </Link>
        <HeaderNav
          basePath={basePath}
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
            path={homePath}
            element={
              <HomeDashboard
                tables={tables}
                rateSettings={rateSettings}
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
            path={`${basePath}/analytics`}
            element={
              <Suspense fallback={<div>Loading Analytics..</div>}>
                <AnalyticsPage />
              </Suspense>
            }
          />
          <Route
            path={`${basePath}/admin/rates`}
            element={
              <RateSettingsPage
                rateSettings={rateSettings}
                onSave={saveRateSettings}
                tables={tables}
                branchConfig={branchConfig}
              />
            }
          />
          <Route
            path={`${basePath}/admin/sales`}
            element={<Navigate to={`${basePath}/admin/rates`} replace />}
          />
          <Route path={`${basePath}/admin/menu`} element={<MenuAdminPage />} />
          <Route path={`${basePath}/admin/bookings`} element={<BookingsPage />} />
          <Route path={`${basePath}/table-view`} element={<TableViewPage tables={tables} />} />
        </Routes>
      </main>
      {tableForModal && (
        <StartModal
          table={tableForModal}
          rateSettings={rateSettings}
          isOpen={!!showModalForTableId}
          onClose={closeStartModal}
          onStart={handleStartTimer}
        />
      )}
      <footer className="app-footer">
        <p>Hourly Rate: {rateSettings.pingPongHourlyRate} GEL</p>
      </footer>
    </div>
  );
}

// ─── Shell: resolves the active branch from the URL ───────────────────
function AppShell() {
  const location = useLocation();
  const branch = resolveBranchFromPath(location.pathname);
  setActiveBranch(branch);
  return <BranchApp key={branch} branch={branch} />;
}

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
