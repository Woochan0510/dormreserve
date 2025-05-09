import React from "react";
import { useNavigate } from "react-router-dom";
import "./main.css";
import url from "./url.jsx";

function Main() {
  const navigate = useNavigate();
  return (
    <div>
      <div className="top_bar">
        <h1 className="main_title">기숙사 시설 예약 시스템</h1>
        <button onClick={() => navigate("/")}>로그아웃</button>
      </div>
      <div className="title_line" />
      <div>
        <div onClick={() => navigate("/book/cook")}>취사실 예약</div>
      </div>
    </div>
  );
}

export default Main;
