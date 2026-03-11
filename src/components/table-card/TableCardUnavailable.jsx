import React from "react";
import SwitchToggle from "../SwitchToggle";

export default function TableCardUnavailable({
  table,
  name,
  isAvailable,
  handleToggleAvailability,
}) {
  return (
    <div
      style={{
        position: "relative",
        backgroundColor: "#ced4da",
        color: "darkGray",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "8px 8px 0px gray",
        display: "flex",
        flexDirection: "column",
        textAlign: "center",
      }}
    >
      <h3
        style={{
          margin: "0 0 10px 0",
          fontSize: "2em",
          fontWeight: "700",
          textTransform: "uppercase",
        }}
      >
        <div>{name || "Custom Timer"}</div>
      </h3>
      <div style={{ position: "absolute", top: 10, right: 10 }}>
        <SwitchToggle
          isAvailable={isAvailable}
          tableId={table.id}
          handleToggleAvailability={handleToggleAvailability}
        />
      </div>
    </div>
  );
}

