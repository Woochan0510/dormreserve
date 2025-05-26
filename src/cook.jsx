import React from "react";
import "./cook.css";
import CookGrid from "./CookGrid";

function Cook() {
  return (
    <div className="base">
      <div className="top_bar">
        <div className="top_title_name">취사실 예약</div>
      </div>
      <div className="main">
        <div className="map">
          <CookGrid />
        </div>
      </div>
    </div>
  );
}

export default Cook;
