import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";

function Login() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      const response = await fetch(
        "https://f7j9sz5d-8000.asse.devtunnels.ms/api/v1/users/login/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            student_id_number: studentId,
            password: password,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();

        localStorage.setItem("token", data.token);
        navigate("/Main");
      } else if (!studentId) {
        setError("아이디를 입력해주세요.");
      } else if (!password) {
        setError("비밀번호를 입력해주세요.");
      } else {
        setError("아이디 또는 비밀번호가 틀렸습니다.");
      }
    } catch (err) {
      setError("오류 발생");
    }
  };

  return (
    <div className="height">
      <div className="login_basic">
        <h1 className="login_title">광운대학교 행복기숙사</h1>
        <label>학번</label>
        <input
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        />
        <label>비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />
        <button onClick={handleLogin}>로그인</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    </div>
  );
}

export default Login;
