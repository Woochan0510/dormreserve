import React from "react";
import { useNavigate } from "react-router-dom";
import "./main.css";
import url from "./util.jsx";
import axios from "axios";

function Main() {
  const navigate = useNavigate();

  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        // 쿠키 이름이 일치하면 값을 디코딩하여 반환
        if (cookie.startsWith(name + "=")) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  const handleLogout = async () => {
    axios
      .post(
        `${url}api/v1/users/logout/`,
        {},
        {
          headers: {
            "X-CSRFToken": getCookie("csrftoken") || "",
            "Content-Type": "application/json", // CSRF 토큰 전송
          },
          withCredentials: true,
        }
      )
      .then((response) => {
        console.log("로그아웃 성공:", response.data);
        navigate("/");
      })
      .catch((error) => {
        console.error("로그아웃 실패:", error.response.data);
        // 에러 처리
      });
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
