import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/LoginPage.css";
import API_BASE_URL from "../../config/api";
import KWLogo from "../../assets/images/kw_logo_word_mark.jpg";
import { loginUser } from "../../services/authService";

function Login() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!studentId) {
      setError("학번을 입력해주세요.");
      return;
    }
    if (!password) {
      setError("비밀번호를 입력해주세요.");
      return;
    }
    setLoading(true);

    try {
      const response = await loginUser(studentId, password);

      if (response.data && response.data.token) {
        localStorage.setItem("authToken", response.data.token);
        navigate("/Main");
      } else if (
        response.status === 200 &&
        response.data.detail === "로그인 성공" &&
        response.data.token
      ) {
        localStorage.setItem("authToken", response.data.token);
        navigate("/Main");
      } else {
        const errorData = response.data || {};
        setError(
          errorData.detail ||
            errorData.message ||
            "로그인에 성공했으나 토큰이 없습니다. 관리자에게 문의하세요."
        );
      }
    } catch (err) {
      let errorMessage = "학번 또는 비밀번호가 틀렸습니다.";
      if (err.response && err.response.data) {
        errorMessage =
          err.response.data.detail || err.response.data.message || errorMessage;
      } else if (err.message) {
        errorMessage = `로그인 중 오류가 발생했습니다. (${err.message})`;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-form-container">
        <div className="login-header">
          <img src={KWLogo} alt="광운대학교 로고" className="login-logo" />
          <h1 className="login-title">광운대학교 행복기숙사</h1>
          <p className="login-subtitle">시설 예약 시스템</p>
        </div>
        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="studentId">학번</label>
            <input
              id="studentId"
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="학번을 입력하세요"
              disabled={loading}
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              disabled={loading}
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          {loading && <p className="loading-message">로그인 중...</p>}
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
