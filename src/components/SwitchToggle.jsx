import React from "react";
import { Switch } from "antd";

const SwitchToggle = ({ isOn, setIsOn, isDisabled = false }) => {
  return (
    <div style={{ display: "flex", paddingTop: "5px" }}>
      <Switch
        checked={isOn}
        onChange={setIsOn}
        disabled={isDisabled}
        size="small"
      />
    </div>
  );
};

export default SwitchToggle;
