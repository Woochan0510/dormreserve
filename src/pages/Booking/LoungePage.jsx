// src/pages/Booking/LoungePage.jsx
import React from "react";
import "../../styles/LoungePage.css"; // Main CSS for the page layout
import ArcadeGrid from "../../components/lounge/ArcadeGrid";
import PingPongGrid from "../../components/lounge/PingpongGrid";

function Lounge() {
  return (
    // Assuming base-page-container and main-content-area are for overall page structure
    // These classes should be defined in a shared CSS or ensure they are present for LoungePage
    <div className="base-page-container">
      <div className="main-content-area">
        {/* The map div will now use lounge-map-layout for specific styling */}
        <div className="map lounge-map-layout">
          {/* Left Column for Arcade Machines */}
          <div className="lounge-section-column arcade-section">
            <h3 className="section-title">오락기</h3>
            <ArcadeGrid />
          </div>

          {/* Right Column for Ping Pong Tables */}
          <div className="lounge-section-column pingpong-section">
            <h3 className="section-title">탁구대</h3>
            <PingPongGrid />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Lounge;
