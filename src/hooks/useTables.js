import { useState, useCallback } from "react";
import { playSound, calculateCost } from "../utils/utils";
import { v4 as uuidv4 } from "uuid";
import { SOUNDS } from "../utils/constants";
import { initializeTables, initializeHistory } from "../utils/storage";
import { sendToGoogleSheets } from "../services/googleSheets";
import { HOURLY_RATE } from '../config';

export default function useTables() {
    const [tables, setTables] = useState(initializeTables);
    const [sessionHistory, setSessionHistory] = useState(initializeHistory);
    const [showModalForTableId, setShowModalForTableId] = useState(null);

    const openStartModal = useCallback((tableId) => {
        setShowModalForTableId(tableId);
    }, []);
    
    const closeStartModal = useCallback(() => {
        setShowModalForTableId(null);
    }, []);

    const handleToggleAvailability = (tableId) => {
        setTables(prevTables =>
          prevTables.map(table =>
            table.id === tableId
              ? { ...table, isAvailable: !table.isAvailable }
              : table
          )
        );
      };

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
            playSound(SOUNDS.PAYMENT_SUCCESS);
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
      sendToGoogleSheets(
            newSessionDetails, 
            'Session'
          );
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

  const handleTransferTimer = useCallback((fromTableId, toTableId) => {
    if (fromTableId === toTableId) return;

    setTables((prevTables) => {
      const fromTable = prevTables.find((t) => t.id === fromTableId);
      const toTable = prevTables.find((t) => t.id === toTableId);
      if (!fromTable || !toTable) return prevTables;

      // Calculate total elapsed on source (including running segment)
      let totalElapsedOnSource = fromTable.elapsedTimeInSeconds || 0;
      if (fromTable.isRunning && fromTable.timerStartTime) {
        totalElapsedOnSource += (Date.now() - fromTable.timerStartTime) / 1000;
      }

      return prevTables.map((table) => {
        if (table.id === fromTableId) {
          // Reset source table
          return {
            ...table,
            timerStartTime: null,
            elapsedTimeInSeconds: 0,
            isRunning: false,
            timerMode: "standard",
            initialCountdownSeconds: null,
          };
        }
        if (table.id === toTableId) {
          // Start on destination based on source mode
          if (fromTable.timerMode === "countdown") {
            const initial = fromTable.initialCountdownSeconds || 0;
            const remaining = Math.max(0, initial - totalElapsedOnSource);
            if (remaining <= 0) {
              // Countdown finished on transfer; reflect finished state
              return {
                ...table,
                timerMode: "countdown",
                initialCountdownSeconds: initial,
                elapsedTimeInSeconds: initial,
                isRunning: false,
                timerStartTime: null,
              };
            }
            // Preserve original purchased countdown for cost display
            // Continue with accumulated elapsed time so remaining stays correct
            return {
              ...table,
              timerMode: "countdown",
              initialCountdownSeconds: initial,
              elapsedTimeInSeconds: totalElapsedOnSource,
              isRunning: true,
              timerStartTime: Date.now(),
            };
          }
          // Standard timer: continue from accumulated elapsed
          return {
            ...table,
            timerMode: "standard",
            initialCountdownSeconds: null,
            elapsedTimeInSeconds: totalElapsedOnSource,
            isRunning: true,
            timerStartTime: Date.now(),
          };
        }
        return table;
      });
    });
  }, []);

  return {
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
  };

}