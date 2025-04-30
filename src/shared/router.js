import react from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../login";
import Main from "../main";
import Cook from "../cook";

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="main" element={<Main />} />
      <Route path="book/cook" element={<Cook />} />
    </Routes>
  );
};

export default Router;
