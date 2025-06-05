import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMyBookings } from "../services/bookingService";
import "../styles/MyBookingsPage.css";

function MyBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      alert("로그인이 필요합니다. 로그인 페이지로 이동합니다.");
      navigate("/");
      return;
    }

    const getMyBookings = async () => {
      try {
        setLoading(true);
        const response = await fetchMyBookings();
        setBookings(response.data);
        setError("");
      } catch (err) {
        console.error("내 예약 정보 조회 실패:", err);
        setError(
          "예약 정보를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        );
        if (err.response && err.response.status === 401) {
          alert(
            "세션이 만료되었거나 인증에 실패했습니다. 다시 로그인해주세요."
          );
          navigate("/");
        }
      } finally {
        setLoading(false);
      }
    };

    getMyBookings();
  }, [navigate]);

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderBookingSection = (title, bookingArray, facilityTypeKey) => {
    if (!bookingArray || bookingArray.length === 0) {
      return null;
    }

    const getFacilityIdentifier = (booking) => {
      if (facilityTypeKey === "ping_pong_table")
        return `탁구대 ${booking.ping_pong_table}`;
      if (facilityTypeKey === "arcade_machine")
        return `오락기 ${booking.arcade_machine}`;
      if (facilityTypeKey === "induction") return `인덕션 ${booking.induction}`;
      if (facilityTypeKey === "treadmill")
        return `트레드밀 ${booking.treadmill}`;
      if (facilityTypeKey === "cycle") return `사이클 ${booking.cycle}`;
      return `시설 ID: ${booking[facilityTypeKey] || booking.id || booking.pk}`;
    };

    return (
      <div className="booking-section">
        <h3>{title}</h3>
        {bookingArray.length > 0 ? (
          <ul>
            {bookingArray.map((booking) => (
              <li key={`${facilityTypeKey}-${booking.pk}`}>
                <p>
                  <strong>시설:</strong> {getFacilityIdentifier(booking)}
                </p>
                <p>
                  <strong>시작 시간:</strong>{" "}
                  {formatDateTime(booking.start_time)}
                </p>
                <p>
                  <strong>종료 시간:</strong> {formatDateTime(booking.end_time)}
                </p>
                <p>
                  <strong>예약 시간:</strong>{" "}
                  {formatDateTime(booking.booked_at)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p>해당 시설에 대한 예약 내역이 없습니다.</p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="my-bookings-container loading">
        예약 정보를 불러오는 중...
      </div>
    );
  }

  if (error) {
    return <div className="my-bookings-container error">{error}</div>;
  }

  if (!bookings) {
    return <div className="my-bookings-container">예약 정보가 없습니다.</div>;
  }

  const allBookingsEmpty =
    (!bookings.ping_pong_table_bookings ||
      bookings.ping_pong_table_bookings.length === 0) &&
    (!bookings.arcade_machine_bookings ||
      bookings.arcade_machine_bookings.length === 0) &&
    (!bookings.induction_bookings ||
      bookings.induction_bookings.length === 0) &&
    (!bookings.treadmill_bookings ||
      bookings.treadmill_bookings.length === 0) &&
    (!bookings.cycle_bookings || bookings.cycle_bookings.length === 0);

  return (
    <div className="my-bookings-container">
      <h2>내 예약 정보</h2>
      {allBookingsEmpty && (
        <p className="no-bookings-message">전체 예약 내역이 없습니다.</p>
      )}
      {renderBookingSection(
        "탁구대 예약",
        bookings.ping_pong_table_bookings,
        "ping_pong_table"
      )}
      {renderBookingSection(
        "오락기 예약",
        bookings.arcade_machine_bookings,
        "arcade_machine"
      )}
      {renderBookingSection(
        "취사실 인덕션 예약",
        bookings.induction_bookings,
        "induction"
      )}
      {renderBookingSection(
        "헬스장 트레드밀 예약",
        bookings.treadmill_bookings,
        "treadmill"
      )}
      {renderBookingSection(
        "헬스장 사이클 예약",
        bookings.cycle_bookings,
        "cycle"
      )}
    </div>
  );
}

export default MyBookingsPage;
