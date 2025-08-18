// src/App.jsx
import React, { useState, useEffect, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import TableCard from "./components/TableCard";
import StartModal from "./components/StartModal";
import SessionHistory from "./components/SessionHistory";
import CocktailRecipes from "./components/CocktailRecipes";
import AnalyticsPage from "./pages/AnalyticsPage";
import MenuAdminPage from "./pages/MenuAdminPage";
import Sidebar from "./components/Sidebar";
import useCart from "./hooks/useCart";
import useTables from "./hooks/useTables";
import { playSound } from "./utils/utils";
import { SOUNDS } from "./utils/constants";
import "./App.css";
// App.jsx
import { HOURLY_RATE, LOCAL_STORAGE_TABLES_KEY, LOCAL_STORAGE_HISTORY_KEY } from './config';

function App() {
  const [_, setTick] = useState(0); // To force re-render for running timers
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    handlePayAndClear 
  } = useTables();

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };
  
  // Interval to update running timers and check for countdown completion
  useEffect(() => {
    const intervalId = setInterval(() => {
      let needsVisualUpdate = false;
      let tableStateChangedDueToCountdown = false;

      const newTables = tables.map((table) => {
        if (table.isRunning) {
          needsVisualUpdate = true; // A timer is running, so visual update is needed
          if (
            table.timerMode === "countdown" &&
            table.initialCountdownSeconds &&
            table.timerStartTime
          ) {
            const elapsedSinceStart =
              (Date.now() - table.timerStartTime) / 1000;
            const totalPassedTime =
              table.elapsedTimeInSeconds + elapsedSinceStart;

            if (totalPassedTime >= table.initialCountdownSeconds) {
              playSound(SOUNDS.TIMER_DONE); // Path from public folder
              console.log(
                `Table ${table.name} countdown finished automatically.`
              );
              tableStateChangedDueToCountdown = true;
              return {
                ...table,
                isRunning: false,
                // Ensure elapsed time is exactly the countdown duration
                elapsedTimeInSeconds: table.initialCountdownSeconds,
                timerStartTime: null, // Clear start time as it's no longer running
              };
            }
          }
        }
        return table;
      });

      if (tableStateChangedDueToCountdown) {
        setTables(newTables); // Update tables state if a countdown finished
      }
      if (needsVisualUpdate) {
        setTick((prevTick) => prevTick + 1); // Trigger re-render for visual time update
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [tables]); // Re-run if tables array reference changes

  // Save tables to local storage
  useEffect(() => {
    // console.log("Tables Effect: Saving tables to localStorage", tables); // Optional: log for table saving
    localStorage.setItem(LOCAL_STORAGE_TABLES_KEY, JSON.stringify(tables));
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
          <Link className="logo" to=''><h1>🏓 MatchPoint Table Manager</h1></Link>
          <div className="nav-container">
            <Link className="nav-link" to='/admin/menu'>Manage Bar</Link>
            <Link className="nav-link home-link" to='/'>Home</Link>
            <button
              onClick={toggleSidebar}
              className="sidebar-toggle-btn"
            >
              
              {isSidebarOpen ? "Close Bar" : "Open Bar"}
            </button>
          </div>
        </header>
        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <>
                <div className="tables-grid">
                  {tables.map((table) => (
                    <TableCard
                      key={table.id}
                      table={table}
                      onOpenStartModal={openStartModal}
                      onStop={handleStopTimer}
                      onPayAndClear={handlePayAndClear}
                      handleToggleAvailability={handleToggleAvailability}
                    />
                  ))}
                </div>
                {isSidebarOpen && (
                  <Sidebar
                    cart={cart}
                    increment={incrementQuantity}
                    decrement={decrementQuantity}
                    remove={removeItem}
                    total={calculateTotal}
                    submit={handleSubmit}
                    addToCart={addToCart}
                    toggleSidebar={toggleSidebar}
                  />
                )}
                <SessionHistory history={sessionHistory} />
                <CocktailRecipes/>
                <Link className="analyticsButton" to='analytics'>Analytics Page</Link>
              </>
              }
            />
            <Route
              path="/analytics"
              element={
                <Suspense fallback={<div>Loading Analytics...</div>}>
                  <AnalyticsPage />
                </Suspense>
              }
            />
            <Route path="/admin/menu" element={<MenuAdminPage />} />
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
