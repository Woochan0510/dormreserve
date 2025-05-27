// src/routes/AppRouter.js
import { Routes, Route, Outlet } from "react-router-dom";
import Main from "../pages/MainPage";
import Login from "../pages/Auth/LoginPage";
import Cook from "../pages/Booking/CookPage";
import Gym from "../pages/Booking/GymPage";
import Lounge from "../pages/Booking/LoungePage";
import SharedHeader from "../components/layout/SharedHeader"; // SharedHeader 임포트

// 로그인 페이지를 제외한 페이지들을 위한 레이아웃 컴포넌트
const MainLayout = ({ pageTitle, showLegend }) => (
  <>
    <SharedHeader pageTitle={pageTitle} showLegend={showLegend} />
    <Outlet /> {/* 하위 라우트의 컴포넌트가 여기에 렌더링됩니다. */}
  </>
);

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      {/* SharedHeader를 사용하는 라우트 그룹 */}
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
    </Routes>
  );
};

export default Router;
