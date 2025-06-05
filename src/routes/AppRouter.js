import { Routes, Route, Outlet } from "react-router-dom";
import Main from "../pages/MainPage";
import Login from "../pages/Auth/LoginPage";
import Cook from "../pages/Booking/CookPage";
import Gym from "../pages/Booking/GymPage";
import Lounge from "../pages/Booking/LoungePage";
import MyBookingsPage from "../pages/MyBookingsPage";
import SharedHeader from "../components/layout/SharedHeader";

const MainLayout = ({ pageTitle, showLegend }) => (
  <>
    <SharedHeader pageTitle={pageTitle} showLegend={showLegend} />
    <Outlet />
  </>
);

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<MainLayout pageTitle="메인 페이지" />}>
        <Route path="main" element={<Main />} />
      </Route>
      <Route element={<MainLayout pageTitle="취사실 예약" showLegend={true} />}>
        <Route path="book/cook" element={<Cook />} />
      </Route>
      <Route element={<MainLayout pageTitle="헬스장 예약" showLegend={true} />}>
        <Route path="book/gym" element={<Gym />} />
      </Route>
      <Route element={<MainLayout pageTitle="오락실 예약" showLegend={true} />}>
        <Route path="book/lounge" element={<Lounge />} />
      </Route>
      <Route
        element={<MainLayout pageTitle="내 예약 정보" showLegend={false} />}
      >
        <Route path="my-bookings" element={<MyBookingsPage />} />
      </Route>
    </Routes>
  );
};

export default Router;
