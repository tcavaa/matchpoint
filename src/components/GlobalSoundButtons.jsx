import React from "react";
import "./GlobalSoundButtons.css";
import { playSound } from "../utils/utils";

export default function GlobalSoundButtons() {
  return (
    <div className="global-sound-buttons" aria-label="Global Sound Buttons">
      <button
        className="start-btn global-sound-btn"
        title="No Food/Drinks"
        onClick={() => playSound("/sound/nofoods.mp3")}
      >
        <img className="global-sound-icon" src="/nofood.png" alt="No Food or Drinks" />
      </button>
      <button
        className="start-btn global-sound-btn"
        title="Do Not Lean"
        onClick={() => playSound("/sound/donotlean.mp3")}
      >
        <img className="global-sound-icon" src="/nolean.png" alt="Do Not Lean" />
      </button>
      <button
        className="start-btn global-sound-btn"
        title="Tournament"
        onClick={() => playSound("/sound/tournament.mp3")}
      >
        <img className="global-sound-icon" src="/tournament.png" alt="Tournament" />
      </button>
    </div>
  );
}


