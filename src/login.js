import React from "react";
import "./login.css";

function Login() {
  return (
    <div class="login_basic">
      <h1 class="login_title">광운대학교 행복기숙사</h1>
      <div>학번</div>
      <input></input>
      <div>비밀번호</div>
      <input type="password"></input>
        <button>로그인</button>
    </div>
  );
}

export default Login;
