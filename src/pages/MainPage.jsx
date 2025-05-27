// src/pages/MainPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/MainPage.css";
// Removed: import { logoutUser } from "../services/authService";

function Main() {
  const navigate = useNavigate();

  // Removed handleLogout function

  return (
    <div>
      {/* <div className="top_bar">
        <h1 className="main_title">기숙사 시설 예약 시스템</h1>
        <button onClick={handleLogout}>로그아웃</button>
      </div>
      <div className="title_line" /> */}{" "}
      {/* SharedHeader가 처리 */}
      <div className="main_page_content">
        {" "}
        {/* 페이지 컨텐츠를 위한 래퍼 추가 */}
        <div className="title_line" />{" "}
        {/* 필요하다면 메인 페이지 전용 구분선 유지 */}
        <div className="main_cell">
          <div className="square" onClick={() => navigate("/book/cook")}>
            취사실 예약
          </div>
          <div className="square" onClick={() => navigate("/book/lounge")}>
            오락실 예약
          </div>
          <div className="square" onClick={() => navigate("/book/gym")}>
            헬스장 예약
          </div>
        </div>
      </div>
    </div>
  );
}

export default Main;
