import React from "react";
import "../../styles/GymPage.css";
import { useNavigate } from "react-router-dom";
import CycleGrid from "../../components/gym/CycleGrid";
import TreadMillGrid from "../../components/gym/TreadMillGrid";

function Gym() {
  const navigate = useNavigate();

  return (
    <div className="base">
      <div className="top_bar">
        <div className="top_bar_name">헬스장 예약</div>
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
          <div className="w-full max-w-[900px] mx-auto">
            <TreadMillGrid />
            <CycleGrid />
          </div>
        </div>
        <button onClick={() => navigate("/main/")} className="main_button">
          메인화면
        </button>
      </div>
    </div>
  );
}

export default Gym;
