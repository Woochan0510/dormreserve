import { Routes, Route } from "react-router-dom";
import Login from "../login";
import Main from "../main";
import Cook from "../cook";
import Lounge from "../lounge";
import Gym from "../gym";

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="main" element={<Main />} />
      <Route path="book/cook" element={<Cook />} />
      <Route path="book/gym" element={<Gym />} />
      <Route path="book/lounge" element={<Lounge />} />
    </Routes>
  );
};

export default Router;
