// src/components/layout/SharedHeader.jsx
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { logoutUser } from "../../services/authService";
import "../../styles/SharedHeader.css"; // 공통 헤더 스타일 파일

const SharedHeader = ({ pageTitle, showLegend = false }) => {
  const navigate = useNavigate();

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
      navigate("/");
    }
  };

  return (
    <div className="shared-top-bar">
      <div className="shared-top-bar-left-content">
        <Link to="/main" className="main-link">
          메인으로
        </Link>
        {pageTitle && <h1 className="page-title">{pageTitle}</h1>}
      </div>

      <div className="shared-top-bar-right-content">
        {showLegend && (
          <div className="legend-container">
            <div className="legend-item">
              <div className="circle" style={{ backgroundColor: "green" }} />
              <span>사용가능</span>
            </div>
            <div className="legend-item">
              <div className="circle" style={{ backgroundColor: "red" }} />
              <span>사용중</span>
            </div>
            <div className="legend-item">
              <div className="circle" style={{ backgroundColor: "yellow" }} />
              <span>수리중</span>
            </div>
          </div>
        )}
        <div className="auth-buttons-container">
          <button
            className="password-change-button"
            onClick={() => alert("비밀번호 변경 기능은 준비중입니다.")}
          >
            비밀번호 변경
          </button>
          <button className="logout-button" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharedHeader;
