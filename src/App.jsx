// src/App.jsx
import React, { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import TableCard from "./components/TableCard";
import StartModal from "./components/StartModal";
import SessionHistory from "./components/SessionHistory";
import { playSound, calculateCost } from "./utils";
import "./App.css";

const TABLE_COUNT = 8;
const HOURLY_RATE = 15; // GEL
const LOCAL_STORAGE_TABLES_KEY = "pingPongTablesData_v2";
const LOCAL_STORAGE_HISTORY_KEY = "pingPongSessionHistory_v1";
const APPS_SCRIPT_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbxEI9gdf7kWAiLMlhxABmGQPosESnD5iI6VCPwLVdD4ICbXs-ToHuucNNj8cSIS0_a7YQ/exec";

const initializeTables = () => {
  const storedTables = localStorage.getItem(LOCAL_STORAGE_TABLES_KEY);
  if (storedTables) {
    try {
      const parsedTables = JSON.parse(storedTables);
      return parsedTables.map((table) => ({
        id: table.id || uuidv4(), // Ensure ID exists
        name: table.name || `Table ${table.id || "N/A"}`,
        timerStartTime:
          table.isRunning && table.timerStartTime ? table.timerStartTime : null,
        elapsedTimeInSeconds:
          typeof table.elapsedTimeInSeconds === "number"
            ? table.elapsedTimeInSeconds
            : 0,
        isRunning:
          typeof table.isRunning === "boolean" ? table.isRunning : false,
        timerMode: table.timerMode || "standard",
        initialCountdownSeconds:
          typeof table.initialCountdownSeconds === "number"
            ? table.initialCountdownSeconds
            : null,
      }));
    } catch (e) {
      console.error("Error parsing stored tables in initializeTables:", e);
    }
  }
  return Array.from({ length: TABLE_COUNT }, (_, i) => ({
    id: i + 1,
    name: `Table ${i + 1}`,
    timerStartTime: null,
    elapsedTimeInSeconds: 0,
    isRunning: false,
    timerMode: "standard",
    initialCountdownSeconds: null,
  }));
};

const initializeHistory = () => {
  const storedHistory = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
  console.log(
    "InitializeHistory: Loading from localStorage. Key:",
    LOCAL_STORAGE_HISTORY_KEY,
    "Data:",
    storedHistory
  );
  if (storedHistory) {
    try {
      const parsedHistory = JSON.parse(storedHistory);
      console.log("InitializeHistory: Parsed history:", parsedHistory);
      return parsedHistory;
    } catch (e) {
      console.error("InitializeHistory: Error parsing stored history:", e);
      return [];
    }
  }
  return [];
};

function App() {
  const [tables, setTables] = useState(initializeTables);
  const [sessionHistory, setSessionHistory] = useState(initializeHistory);
  const [_, setTick] = useState(0); // To force re-render for running timers
  const [showModalForTableId, setShowModalForTableId] = useState(null);

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
              playSound("/sound/timer_done.mp3"); // Path from public folder
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

  const openStartModal = useCallback((tableId) => {
    setShowModalForTableId(tableId);
  }, []);

  const closeStartModal = useCallback(() => {
    setShowModalForTableId(null);
  }, []);

  const handleStartTimer = useCallback(
    (tableId, mode, durationMinutes) => {
      setTables((prevTables) =>
        prevTables.map((table) => {
          if (table.id === tableId) {
            if (
              mode === "countdown" &&
              durationMinutes &&
              durationMinutes > 0
            ) {
              return {
                ...table,
                timerMode: "countdown",
                initialCountdownSeconds: durationMinutes * 60,
                elapsedTimeInSeconds: 0, // Reset elapsed for new countdown
                isRunning: true,
                timerStartTime: Date.now(),
              };
            } else {
              // Standard mode
              return {
                ...table,
                timerMode: "standard",
                initialCountdownSeconds: null,
                // elapsedTimeInSeconds is kept if resuming standard timer (or 0 if new)
                isRunning: true,
                timerStartTime: Date.now(),
              };
            }
          }
          return table;
        })
      );
      closeStartModal();
    },
    [closeStartModal]
  );

  const handleStopTimer = useCallback((tableId) => {
    setTables((prevTables) =>
      prevTables.map((table) => {
        if (table.id === tableId && table.isRunning && table.timerStartTime) {
          const elapsedSinceLastStart =
            (Date.now() - table.timerStartTime) / 1000;
          return {
            ...table,
            isRunning: false,
            elapsedTimeInSeconds:
              table.elapsedTimeInSeconds + elapsedSinceLastStart,
            timerStartTime: null,
          };
        }
        return table;
      })
    );
  }, []);

  const handlePayAndClear = useCallback(
    (tableId) => {
      console.log(`handlePayAndClear: Called for tableId: ${tableId}`);
      const tableToClear = tables.find((t) => t.id === tableId);

      if (!tableToClear) {
        console.error(`handlePayAndClear: Table with id ${tableId} not found.`);
        return;
      }
      // ... (rest of the logic to calculate finalElapsedTimeInSeconds, durationForBilling, amountToPay remains the same) ...
      let finalElapsedTimeInSeconds = tableToClear.elapsedTimeInSeconds;
      if (tableToClear.isRunning && tableToClear.timerStartTime) {
        finalElapsedTimeInSeconds +=
          (Date.now() - tableToClear.timerStartTime) / 1000;
      }

      let durationForBilling = 0;
      const sessionTypeForHistory = tableToClear.timerMode;

      if (tableToClear.timerMode === "countdown") {
        durationForBilling = tableToClear.initialCountdownSeconds || 0;
      } else {
        durationForBilling = finalElapsedTimeInSeconds;
      }

      const amountToPay = parseFloat(
        calculateCost(durationForBilling, HOURLY_RATE)
      );

      const newSessionDetails = {
        id: uuidv4(),
        tableId: tableToClear.id,
        tableName: tableToClear.name,
        endTime: new Date().toISOString(),
        durationPlayed: durationForBilling,
        amountPaid: amountToPay,
        sessionType: sessionTypeForHistory,
      };
      console.log(
        "handlePayAndClear: Created newSessionDetails:",
        newSessionDetails
      );

      // Update local React state for tables
      setTables((prevTables) =>
        prevTables.map((table) => {
          if (table.id === tableId) {
            playSound("/sound/payment_success.mp3");
            console.log(`handlePayAndClear: Resetting table: ${table.name}`);
            return {
              ...table,
              timerStartTime: null,
              elapsedTimeInSeconds: 0,
              isRunning: false,
              timerMode: "standard",
              initialCountdownSeconds: null,
            };
          }
          return table;
        })
      );

      // Update local React state for session history (and thus local storage via its useEffect)
      console.log(
        "handlePayAndClear: newSessionDetails is valid, attempting to update local sessionHistory."
      );
      setSessionHistory((prevHistory) => {
        const updatedHistory = [...prevHistory, newSessionDetails];
        console.log(
          "handlePayAndClear: New local history to be set:",
          updatedHistory
        );
        return updatedHistory;
      });

      // 👇 --- NEW: Send data to Google Sheets --- 👇
      if (
        APPS_SCRIPT_WEB_APP_URL === "YOUR_COPIED_WEB_APP_URL_HERE" ||
        !APPS_SCRIPT_WEB_APP_URL
      ) {
        console.warn(
          "Google Sheets Sync: APPS_SCRIPT_WEB_APP_URL is not set. Skipping sync."
        );
      } else {
        console.log(
          "Google Sheets Sync: Sending data to Apps Script:",
          newSessionDetails
        );
        fetch(APPS_SCRIPT_WEB_APP_URL, {
          method: "POST",
          mode: "cors", // Keep 'cors' to try and read the response
          cache: "no-cache",
          headers: {
            "Content-Type": "text/plain", // <<< --- CHANGE TO THIS
          },
          body: JSON.stringify(newSessionDetails), // Body is still your JSON data as a string
        })
          .then((response) => {
            // Try to parse JSON regardless of ok status to get error message from script
            return response.json().then((data) => ({
              ok: response.ok,
              status: response.status,
              data,
            }));
          })
          .then(({ ok, status, data }) => {
            if (ok && data.status === "success") {
              console.log("Google Sheets Sync Success:", data);
            } else {
              console.error(
                "Google Sheets Sync Error (from script or network):",
                data
              );
              // Log more details if available from the 'data' object from your script
              if (data && data.message)
                console.error("Script error message:", data.message);
            }
          })
          .catch((error) => {
            console.error("Google Sheets Sync Network Error:", error);
          });
      }
      // 👆 --- End of Google Sheets send data --- 👆
    },
    [
      tables,
      HOURLY_RATE,
      calculateCost,
      playSound,
      setTables,
      setSessionHistory,
    ]
  );

  const tableForModal = tables.find((t) => t.id === showModalForTableId);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🏓 MatchPoint Table Manager</h1>
      </header>
      <main className="main-content">
        <div className="tables-grid">
          {tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onOpenStartModal={openStartModal}
              onStop={handleStopTimer}
              onPayAndClear={handlePayAndClear}
            />
          ))}
        </div>
        <SessionHistory history={sessionHistory} />
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
  );
}

export default App;
