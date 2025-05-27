// src/pages/MainPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/MainPage.css";
// Removed: import API_BASE_URL from "../config/api";
// Removed: import axios from "axios";
import { logoutUser } from "../services/authService"; // Import from authService

function Main() {
  const navigate = useNavigate();

  // Removed getCookie if not needed elsewhere

  const handleLogout = async () => {
    try {
      await logoutUser();
      console.log("로그아웃 성공");
      navigate("/");
    } catch (error) {
      console.error(
        "로그아웃 실패:",
        error.response ? error.response.data : error.message
      );
      // Optionally, still navigate to login page or show an error
      navigate("/");
    }
  };

  return (
    <div>
      <div className="top_bar">
        <h1 className="main_title">기숙사 시설 예약 시스템</h1>
        <button onClick={handleLogout}>로그아웃</button>
      </div>
      <div className="title_line" />
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
  );
}

export default Main;
