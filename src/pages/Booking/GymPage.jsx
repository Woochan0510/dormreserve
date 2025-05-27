// src/pages/Booking/GymPage.jsx
import React from "react";
import "../../styles/GymPage.css";
// Removed: import { useNavigate } from "react-router-dom";
import CycleGrid from "../../components/gym/CycleGrid";
import TreadMillGrid from "../../components/gym/TreadMillGrid";

function Gym() {
  // Removed: const navigate = useNavigate();

  return (
    <div className="base-page-container">
      <div className="main-content-area">
        <div className="map">
          <div className="w-full max-w-[900px] mx-auto">
            <TreadMillGrid />
            <CycleGrid />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Gym;
