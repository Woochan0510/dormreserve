// src/pages/Booking/GymPage.jsx
import React from "react";
import "../../styles/GymPage.css"; // Main CSS for the Gym page layout
import CycleGrid from "../../components/gym/CycleGrid";
import TreadMillGrid from "../../components/gym/TreadMillGrid";

function Gym() {
  return (
    <div className="base-page-container">
      <div className="main-content-area">
        <div className="map gym-map-layout">
          {" "}
          {/* Apply gym-specific layout */}
          <div className="gym-section treadmill-section">
            <h3 className="section-title">트레드밀</h3>
            <TreadMillGrid />
          </div>
          <div className="gym-section cycle-section">
            <h3 className="section-title">사이클</h3>
            <CycleGrid />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Gym;
