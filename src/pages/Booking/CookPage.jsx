import React from "react";
import "../../styles/CookPage.css";
import CookGrid from "../../components/cook/CookGrid";
import { useNavigate } from "react-router-dom";

function Cook() {
  const navigate = useNavigate();

  return (
    <div className="base">
      <div className="top_bar">
        <div className="top_title_name">취사실 예약</div>
        <div className="top_right">
          <div className="top_right_set">
            <div className="circle" style={{ backgroundColor: "green" }} />
            <div>사용가능</div>
          </div>
          <div className="top_right_set">
            <div className="circle" style={{ backgroundColor: "red" }} />
            <div>사용중</div>
          </div>
          <div className="top_right_set">
            <div className="circle" style={{ backgroundColor: "yellow" }} />
            <div>수리중</div>
          </div>
        </div>
      </div>
      <div className="main">
        <div className="map">
          <CookGrid />
        </div>
        <button onClick={() => navigate("/main/")} className="main_button">
          메인화면
        </button>
      </div>
    </div>
  );
}

export default Cook;
