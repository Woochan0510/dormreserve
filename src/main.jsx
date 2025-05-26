import React from "react";
import { useNavigate } from "react-router-dom";
import "./main.css";
import url from "./url.jsx";

function Main() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(url + "api/v1/users/logout/", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        navigate("/");
      } else {
        const data = await response.json();
        console.log("error:", data);
      }
    } catch (err) {
      console.log("error", err);
    }
  };

  return (
    <div>
      <div className="top_bar">
        <h1 className="main_title">기숙사 시설 예약 시스템</h1>
        <button onClick={handleLogout}>로그아웃</button>
      </div>
      <div className="title_line" />
      <div>
        <div onClick={() => navigate("/book/cook")}>취사실 예약</div>
      </div>
    </div>
  );
}

export default Main;
