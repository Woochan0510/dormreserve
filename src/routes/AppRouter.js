import { Routes, Route } from "react-router-dom";
import Main from "../pages/MainPage";
import Login from "../pages/Auth/LoginPage";
import Cook from "../pages/Booking/CookPage";
import Gym from "../pages/Booking/GymPage";
import Lounge from "../pages/Booking/LoungePage";

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
