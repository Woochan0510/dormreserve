import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./login.css";

function Login() {
  return (
    <div className="height">
      <div className="login_basic">
        <h1 className="login_title">광운대학교 행복기숙사</h1>
        <div>학번</div>
        <input></input>
        <div>비밀번호</div>
        <input type="password"></input>
        <br />
        <button>로그인</button>
      </div>
    </div>
  );
}

export default Login;
