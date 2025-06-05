// src/components/layout/SharedHeader.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Link 임포트 확인
import { logoutUser, changePassword } from "../../services/authService";
import "../../styles/SharedHeader.css";

const SharedHeader = ({ pageTitle, showLegend = false }) => {
  const navigate = useNavigate();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordCheck, setNewPasswordCheck] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isPasswordChangeLoading, setIsPasswordChangeLoading] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutUser();
      console.log("로그아웃 성공");
      localStorage.removeItem("authToken"); // 추가: 로그아웃 시 토큰 확실히 제거
      navigate("/");
    } catch (error) {
      console.error(
        "로그아웃 실패:",
        error.response ? error.response.data : error.message
      );
      localStorage.removeItem("authToken"); // 실패 시에도 토큰 제거
      navigate("/");
    }
  };

  const openPasswordModal = () => {
    setIsPasswordModalOpen(true);
    setOldPassword("");
    setNewPassword("");
    setNewPasswordCheck("");
    setPasswordError("");
    setPasswordSuccess("");
  };

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!oldPassword || !newPassword || !newPasswordCheck) {
      setPasswordError("모든 필드를 입력해주세요.");
      return;
    }
    if (newPassword !== newPasswordCheck) {
      setPasswordError("새 비밀번호와 새 비밀번호 확인이 일치하지 않습니다.");
      setNewPassword("");
      setNewPasswordCheck("");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("새 비밀번호는 8자 이상이어야 합니다.");
      setNewPassword("");
      setNewPasswordCheck("");
      return;
    }

    setIsPasswordChangeLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      setPasswordSuccess(
        "비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요."
      );
      setOldPassword("");
      setNewPassword("");
      setNewPasswordCheck("");
      // 비밀번호 변경 성공 시 로그아웃 처리 및 로그인 페이지로 이동
      setTimeout(async () => {
        await handleLogout(); // 기존 로그아웃 함수 재활용
      }, 2000); // 2초 후 로그아웃
    } catch (error) {
      const errorMsg =
        error.response?.data?.old_password ||
        error.response?.data?.new_password ||
        error.response?.data?.detail ||
        "비밀번호 변경에 실패했습니다. 기존 비밀번호를 확인해주세요.";
      setPasswordError(errorMsg);
      setNewPassword(""); // 오류 시 새 비밀번호 필드 초기화
      setNewPasswordCheck(""); // 오류 시 새 비밀번호 확인 필드 초기화
    } finally {
      setIsPasswordChangeLoading(false);
    }
  };

  return (
    <>
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
            {/* "내 예약" 링크 추가 */}
            <Link to="/my-bookings" className="header-nav-link">
              내 예약
            </Link>
            <button
              className="password-change-button"
              onClick={openPasswordModal}
            >
              비밀번호 변경
            </button>
            <button className="logout-button" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        </div>
      </div>

      {isPasswordModalOpen && (
        <div className="modal-overlay" onClick={closePasswordModal}>
          <div
            className="modal password-change-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>비밀번호 변경</h2>
            <form onSubmit={handleChangePassword}>
              <div className="input-group">
                <label htmlFor="oldPassword">현재 비밀번호</label>
                <input
                  id="oldPassword"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="현재 비밀번호"
                  disabled={isPasswordChangeLoading}
                  autoComplete="current-password"
                />
              </div>
              <div className="input-group">
                <label htmlFor="newPassword">새 비밀번호</label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호 (8자 이상)"
                  disabled={isPasswordChangeLoading}
                  autoComplete="new-password"
                />
              </div>
              <div className="input-group">
                <label htmlFor="newPasswordCheck">새 비밀번호 확인</label>
                <input
                  id="newPasswordCheck"
                  type="password"
                  value={newPasswordCheck}
                  onChange={(e) => setNewPasswordCheck(e.target.value)}
                  placeholder="새 비밀번호 확인"
                  disabled={isPasswordChangeLoading}
                  autoComplete="new-password"
                />
              </div>
              {passwordError && (
                <p className="error-message">{passwordError}</p>
              )}
              {passwordSuccess && (
                <p className="success-message">{passwordSuccess}</p>
              )}
              {isPasswordChangeLoading && (
                <p className="loading-message">변경 중...</p>
              )}
              <div className="modal-buttons">
                <button
                  type="submit"
                  className="modal-action-button"
                  disabled={isPasswordChangeLoading}
                >
                  {isPasswordChangeLoading ? "변경 중..." : "변경하기"}
                </button>
                <button
                  type="button"
                  className="modal-close-button"
                  onClick={closePasswordModal}
                  disabled={isPasswordChangeLoading}
                >
                  닫기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default SharedHeader;
