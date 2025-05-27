import "../../styles/LoungePage.css";
import { useNavigate } from "react-router-dom";
import LoungeGrid from "../../components/lounge/PingpongGrid";

function Lounge() {
  const navigate = useNavigate();

  return (
    <div className="base">
      <div className="top_bar">
        <div className="top_bar_name">오락실 예약</div>
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
          <LoungeGrid />
        </div>
        <button onClick={() => navigate("/main/")} className="main_button">
          메인화면
        </button>
      </div>
    </div>
  );
}

export default Lounge;
