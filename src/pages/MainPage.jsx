import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/MainPage.css";

function Main() {
  const navigate = useNavigate();

  useEffect(() => {
    console.log("MainPage useEffect가 실행되었습니다.");

    const authToken = localStorage.getItem("authToken");
    console.log("localStorage에서 가져온 authToken:", authToken);

    if (!authToken) {
      alert(
        "세션이 만료되었거나 로그인되지 않았습니다. 로그인 페이지로 이동합니다."
      );
      navigate("/");
    } else {
      console.log("인증 토큰을 찾았습니다. 사용자가 인증되었습니다.");
    }
  }, [navigate]);

  return (
    <div>
      <div className="main_page_content">
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
    </div>
  );
}

export default Main;
