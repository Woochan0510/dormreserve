import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/LoginPage.css";
import API_BASE_URL from "../../config/api";
import KWLogo from "../../assets/images/kw_logo_word_mark.jpg";

function Login() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // 로딩 상태 추가

  function getCookie(name) {
    let cookieValue = "";
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(name + "=")) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // 이전 에러 메시지 초기화

    if (!studentId) {
      setError("학번을 입력해주세요.");
      return;
    }
    if (!password) {
      setError("비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true); // 로딩 시작

    try {
      const response = await fetch(API_BASE_URL + "api/v1/users/login/", {
        //
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken") || "",
        },
        credentials: "include",
        body: JSON.stringify({
          student_id_number: studentId,
          password: password,
        }),
      });

      if (response.status === 200) {
        navigate("/Main");
      } else {
        const errorData = await response.json().catch(() => ({})); // 에러 응답이 JSON이 아닐 경우를 대비
        setError(
          errorData.detail ||
            errorData.message ||
            "학번 또는 비밀번호가 틀렸습니다."
        );
      }
    } catch (err) {
      setError(`로그인 중 오류가 발생했습니다. (${err.message})`);
    } finally {
      setLoading(false); // 로딩 종료
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
