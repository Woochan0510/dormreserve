// src/pages/Booking/LoungePage.jsx
import "../../styles/LoungePage.css";
// Removed: import { useNavigate } from "react-router-dom";
import PingPongGrid from "../../components/lounge/PingpongGrid.jsx";
import ArcadeGrid from "../../components/lounge/ArcadeGrid.jsx";

function Lounge() {
  // Removed: const navigate = useNavigate();

  return (
    <div className="base-page-container">
      <div className="main-content-area">
        <div className="map">
          <div className="main_row">
            <ArcadeGrid />
            <PingPongGrid />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Lounge;
