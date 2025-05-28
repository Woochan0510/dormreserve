// src/pages/Booking/CookPage.jsx
import React from "react";
import "../../styles/CookPage.css";
import CookGrid from "../../components/cook/CookGrid";
// Removed: import { useNavigate } from "react-router-dom";
// Removed: import { logoutUser } from "../../services/authService";

function Cook() {
  return (
    <div className="base-page-container">
      {" "}
      {/* 이 클래스는 src/styles/CookGrid.css 에 정의됨 */}
      {/* SharedHeader가 AppRouter에서 이 페이지를 감싸면서 렌더링됩니다. */}
      <div className="main-content-area">
        {" "}
        {/* 이 클래스도 src/styles/CookGrid.css 에 정의됨 */}
        <div className="map">
          {" "}
          {/* 이 클래스도 src/styles/CookGrid.css 에 정의됨 */}
          <CookGrid />
        </div>
      </div>
    </div>
  );
}

export default Cook;
