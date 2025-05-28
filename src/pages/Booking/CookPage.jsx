// src/pages/Booking/CookPage.jsx
import React from "react";
import "../../styles/CookPage.css"; // 현재 이 파일을 사용하고 있음
import CookGrid from "../../components/cook/CookGrid";

function Cook() {
  return (
    <div className="base-page-container">
      {" "}
      {/* 이 클래스는 CookPage.css에 없음 */}
      <div className="main-content-area">
        {" "}
        {/* 이 클래스도 CookPage.css에 없음 */}
        <div className="map">
          {" "}
          {/* 이 클래스는 CookPage.css에 정의되어 있음! */}
          <CookGrid />
        </div>
      </div>
    </div>
  );
}

export default Cook;
