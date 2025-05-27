// src/pages/Booking/CookPage.jsx
import React from "react";
import "../../styles/CookPage.css";
import CookGrid from "../../components/cook/CookGrid";
// Removed: import { useNavigate } from "react-router-dom";
// Removed: import { logoutUser } from "../../services/authService";

function Cook() {
  // Removed: const navigate = useNavigate();
  // Removed: const handleLogout = ...

  return (
    <div className="base-page-container">
      {" "}
      {/* 전체 페이지 컨테이너 */}
      {/* SharedHeader가 AppRouter에서 이 페이지를 감싸면서 렌더링됩니다. */}
      {/* pageTitle과 showLegend는 AppRouter의 MainLayout을 통해 전달됩니다. */}
      <div className="main-content-area">
        {" "}
        {/* 헤더를 제외한 컨텐츠 영역 */}
        <div className="map">
          <CookGrid />
        </div>
      </div>
    </div>
  );
}

export default Cook;
