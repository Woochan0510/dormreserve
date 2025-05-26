import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";
import url from "./util.jsx";

function Login() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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

    try {
      const response = await fetch(url + "api/v1/users/login/", {
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
      } else if (!studentId) {
        setError("아이디를 입력해주세요.");
      } else if (!password) {
        setError("비밀번호를 입력해주세요.");
      } else {
        setError("아이디 또는 비밀번호가 틀렸습니다.");
      }
    } catch (err) {
      setError(`오류 발생 ${err}`);
    }
  };

  return (
    <div className="height">
      <div className="login_basic">
        <h1 className="login_title">광운대학교 행복기숙사</h1>
        <form className="input_bar" action="">
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
          <button onClick={handleLogin} type="submit">
            로그인
          </button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default Login;
