import React from "react";
import { Switch } from "antd";

const SwitchToggle = ({ isAvailable, tableId, handleToggleAvailability, isDisabled = false }) => {
  //console.log(isAvailable);
  return (
    <div style={{ display: "flex", paddingTop: "5px" }}>
      <Switch
        checked={isAvailable}
        onChange={() => handleToggleAvailability(tableId)}
        disabled={isDisabled}
        size="small"
      />
    </div>
  );
};

export default SwitchToggle;
