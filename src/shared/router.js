import react from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../login";
import Main from "../main";

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="Main" element={<Main />} />
    </Routes>
  );
};

export default Router;
