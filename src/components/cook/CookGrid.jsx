import React, { useEffect, useState } from "react";
import API_BASE_URL from "../../config/api";
import axios from "axios";

const CookGrid = () => {
  // 인덕션 배치 정보를 정의합니다.
  const tables = [
    [
      { top: "10%", left: "10%" },
      { bottom: "10%", right: "10%" },
    ],
    [
      { top: "10%", left: "30%" },
      { bottom: "10%", left: "30%" },
    ],
    [], // 이 배열은 빈 공간이므로 인덕션이 배치되지 않습니다.
    [
      { top: "20%", left: "10%" },
      { bottom: "10%", right: "10%" },
    ],
    [
      { top: "10%", left: "30%" },
      { bottom: "10%", left: "30%" },
    ],
    [], // 이 배열은 빈 공간이므로 인덕션이 배치되지 않습니다.
  ];

  // 상태(state) 변수들을 정의합니다.
  const [statuses, setStatuses] = useState(Array(8).fill(null));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInduction, setSelectedInduction] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);

  // 30분 단위 시간 슬롯을 생성하는 함수 (예: "00:00", "00:30", ..., "23:30")
  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const hh = String(hour).padStart(2, "0");
        const mm = String(min).padStart(2, "0");
        slots.push(`${hh}:${mm}`);
      }
    }
    return slots;
  };

  // CSRF 토큰을 쿠키에서 가져오는 함수
  function getCookie(name) {
    let cookieValue = null;
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

  // 선택된 시간 슬롯을 예약하는 비동기 함수
  const reserveSlot = async (startTime) => {
    try {
      await axios.post(
        `${API_BASE_URL}api/v1/kitchen/inductions/${selectedInduction}/book/`,
        {
          start_time: startTime,
          duration_minute: 30,
        },
        {
          headers: {
            "X-CSRFToken": getCookie("csrftoken") || "",
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      alert("예약이 완료되었습니다.");
      await fetchSlotsForSelectedDateAndInduction();
      // 예약 성공 후 인덕션 상태도 새로고침하여 is_using 반영 (선택 사항)
      // fetchStatuses();
    } catch (error) {
      console.error("예약 실패:", error);
      alert(
        "예약 실패: " +
          (error.response?.data?.message ||
            error.message ||
            "알 수 없는 에러가 발생했습니다.")
      );
    }
  };

  // 선택된 날짜와 인덕션에 대한 시간 슬롯을 불러오는 재사용 가능한 함수
  const fetchSlotsForSelectedDateAndInduction = async () => {
    if (!selectedDate || !selectedInduction) return;

    try {
      const res = await axios.get(
        `${API_BASE_URL}api/v1/kitchen/inductions/${selectedInduction}/timeslots/`,
        {
          params: { date: selectedDate },
          withCredentials: true,
          headers: {
            "X-CSRFToken": getCookie("csrftoken") || "",
          },
        }
      );

      const bookedSet = new Set(
        res.data.map((slot) => {
          const date = new Date(slot.start_time);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          const hour = String(date.getHours()).padStart(2, "0");
          const minute = String(date.getMinutes()).padStart(2, "0");
          return `${year}-${month}-${day}T${hour}:${minute}`;
        })
      );

      const now = new Date();

      const allSlots = getTimeSlots().map((time) => {
        const fullDateTime = `${selectedDate}T${time}`;
        const slotDateTime = new Date(fullDateTime);

        const isPast = slotDateTime < now;
        const isBooked = bookedSet.has(fullDateTime);

        return {
          start_time: fullDateTime,
          is_booked: isBooked,
          is_past: isPast,
        };
      });

      setTimeSlots(allSlots);
    } catch (error) {
      console.error("시간 슬롯 불러오기 실패", error);
    }
  };

  // 컴포넌트 마운트 시 인덕션 상태를 초기 로딩합니다.
  const fetchStatuses = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}api/v1/kitchen/inductions/`, {
        headers: {
          "X-CSRFToken": getCookie("csrftoken") || "",
        },
        withCredentials: true,
      });
      const apiData = res.data;

      const sortedStatuses = Array(8).fill(null);
      apiData.forEach((item) => {
        const index = item.pk - 1;
        if (index >= 0 && index < 8) {
          sortedStatuses[index] = {
            is_available: item.is_available,
            is_using: item.is_using,
          };
        }
      });

      setStatuses(sortedStatuses);
    } catch (error) {
      console.error("인덕션 상태 API 호출 실패", error);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  useEffect(() => {
    fetchSlotsForSelectedDateAndInduction();
  }, [selectedDate, selectedInduction]);

  let globalInductionNumber = 1;

  // 인덕션 클릭 시 호출되는 함수
  const handleClick = (inductionNumber) => {
    const statusData = statuses[inductionNumber - 1];

    if (!statusData) {
      alert("인덕션 상태를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    // is_available이 false (인덕션 사용 불가) 일 때만 경고 메시지를 띄우고 모달을 열지 않습니다.
    if (statusData.is_available === false) {
      alert("이 인덕션은 현재 사용할 수 없습니다.");
      return;
    }

    // 인덕션이 is_available이 true이면 is_using 여부와 상관없이 모달을 엽니다.
    // (사용 중이더라도 예약은 가능하도록)
    if (statusData.is_available === true) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const formattedToday = `${year}-${month}-${day}`;

      setSelectedDate(formattedToday);
      setSelectedInduction(inductionNumber);
      setIsModalOpen(true);
    }
  };

  // 날짜 선택 드롭다운 변경 시 호출되는 함수
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  return (
    <div className="grid-container">
      {tables.map((items, tableIndex) => (
        <div className="table" key={tableIndex}>
          {items.map((induction, inductionIndex) => {
            const number = globalInductionNumber++;
            const statusData = statuses[number - 1];

            let backgroundColor;
            if (statusData === null) {
              backgroundColor = "gray"; // 로딩 중
            } else if (statusData.is_using === true) {
              backgroundColor = "red"; // 사용 중일 때 빨간색 (클릭은 가능)
            } else if (statusData.is_available === false) {
              backgroundColor = "red"; // 사용 불가능할 때 빨간색 (클릭 불가)
            } else {
              backgroundColor = "green"; // 사용 가능하고 사용 중 아닐 때 초록색
            }

            return (
              <div
                key={inductionIndex}
                className="induction"
                style={{
                  ...induction,
                  position: "absolute",
                  // is_available이 false일 때만 클릭을 막습니다. (is_using은 예약 가능)
                  cursor:
                    statusData && statusData.is_available === false
                      ? "not-allowed"
                      : "pointer",
                  backgroundColor,
                }}
                onClick={() => handleClick(number)}
              >
                {number}
              </div>
            );
          })}
        </div>
      ))}

      {/* 모달 창 (isModalOpen이 true일 때만 렌더링) */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>인덕션 {selectedInduction}번</h2>

            {/* 날짜 선택 드롭다운 */}
            <select onChange={handleDateChange} value={selectedDate || ""}>
              {Array.from({ length: 7 }).map((_, index) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const dateOption = new Date(today);
                dateOption.setDate(today.getDate() + index);

                const year = dateOption.getFullYear();
                const month = String(dateOption.getMonth() + 1).padStart(
                  2,
                  "0"
                );
                const day = String(dateOption.getDate()).padStart(2, "0");
                const formattedDate = `${year}-${month}-${day}`;

                const weekday = dateOption.toLocaleDateString("ko-KR", {
                  weekday: "short",
                });

                return (
                  <option key={index} value={formattedDate}>
                    {formattedDate} ({weekday})
                  </option>
                );
              })}
            </select>

            {/* 시간 슬롯 목록 (selectedDate가 선택되었을 때만 렌더링) */}
            {selectedDate && (
              <div className="time-slots">
                <h4>{selectedDate}의 시간 선택</h4>
                <ul>
                  {timeSlots.map((slot, index) => (
                    <li
                      key={index}
                      style={{
                        color: slot.is_booked
                          ? "red"
                          : slot.is_past
                          ? "gray"
                          : "green",
                        cursor:
                          slot.is_booked || slot.is_past
                            ? "not-allowed"
                            : "pointer",
                      }}
                      onClick={() => {
                        if (!slot.is_booked && !slot.is_past) {
                          reserveSlot(slot.start_time);
                        }
                      }}
                    >
                      {new Date(slot.start_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 모달 닫기 버튼 */}
            <button onClick={() => setIsModalOpen(false)}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CookGrid;
