// src/components/cook/CookGrid.jsx
import React, { useEffect, useState } from "react";
import "../../styles/CookGrid.css"; // Ensure this path is correct
import {
  fetchInductionStatuses,
  fetchInductionTimeSlots,
  reserveInductionSlot as reserveInductionSlotAPI,
} from "../../services/bookingService";

const CookGrid = () => {
  const inductionStations = [
    {
      id: "station-1-left",
      groups: [
        { id: "group-1-top", inductions: [1, 2] },
        { id: "group-1-bottom", inductions: [3, 4] },
      ],
    },
    {
      id: "station-2-middle",
      groups: [
        { id: "group-2-top", inductions: [5, 6] },
        { id: "group-2-bottom", inductions: [7, 8] },
      ],
    },
    {
      id: "station-3-right",
      groups: [
        { id: "group-3-top", inductions: [null, null] },
        { id: "group-3-bottom", inductions: [null, null] },
      ],
    },
  ];

  const [statuses, setStatuses] = useState(Array(8).fill(null));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInduction, setSelectedInduction] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [isTimeSlotsLoading, setIsTimeSlotsLoading] = useState(false); // 시간 슬롯 로딩 상태

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

  const reserveSlot = async (startTime) => {
    if (!selectedInduction) {
      alert("예약할 인덕션을 선택해주세요.");
      return;
    }
    try {
      await reserveInductionSlotAPI(selectedInduction, startTime);
      alert("예약이 완료되었습니다.");
      await fetchSlotsForSelectedDateAndInduction();
      fetchStatuses();
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

  const fetchSlotsForSelectedDateAndInduction = async () => {
    if (!selectedDate || !selectedInduction) return;
    setIsTimeSlotsLoading(true); // 로딩 시작
    setTimeSlots([]); // 이전 슬롯 초기화
    try {
      const res = await fetchInductionTimeSlots(
        selectedInduction,
        selectedDate
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
      setTimeSlots([]); // 에러 시 빈 배열로 설정
    } finally {
      setIsTimeSlotsLoading(false); // 로딩 완료
    }
  };

  const fetchStatuses = async () => {
    try {
      const res = await fetchInductionStatuses();
      const apiData = res.data;
      const newStatuses = Array(8).fill(null);
      apiData.forEach((item) => {
        const index = item.pk - 1;
        if (index >= 0 && index < 8) {
          newStatuses[index] = {
            pk: item.pk,
            is_available: item.is_available,
            is_using: item.is_using,
          };
        }
      });
      setStatuses(newStatuses);
    } catch (error) {
      console.error("인덕션 상태 API 호출 실패", error);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  useEffect(() => {
    if (selectedInduction && selectedDate) {
      fetchSlotsForSelectedDateAndInduction();
    }
  }, [selectedDate, selectedInduction]); // selectedInduction도 의존성 배열에 추가

  const handleInductionClick = (inductionPk) => {
    if (inductionPk === null) return;

    const statusData = statuses[inductionPk - 1];
    if (!statusData) {
      alert("인덕션 상태를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    if (statusData.is_available === false) {
      alert("이 인덕션은 현재 사용할 수 없습니다 (수리/고장).");
      return;
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const formattedToday = `${year}-${month}-${day}`;

    // 날짜가 변경되지 않았더라도, 다른 인덕션을 클릭하면 해당 인덕션의 시간표를 새로 가져와야 함.
    // 만약 selectedDate가 이미 formattedToday와 같고, selectedInduction도 같다면 fetch를 또 할 필요는 없지만,
    // 현재 로직은 selectedDate, selectedInduction이 변경될 때 useEffect에서 fetch하므로 괜찮음.
    setSelectedDate(formattedToday);
    setSelectedInduction(inductionPk);
    setIsModalOpen(true);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    // 날짜 변경 시, timeSlots를 즉시 비우거나 로딩 상태로 만들어 사용자에게 피드백을 줄 수 있음
    // setTimeSlots([]); // 옵션: 즉시 비우기
    // setIsTimeSlotsLoading(true); // 옵션: 로딩 상태로 만들기 (useEffect에서 어차피 다시 fetch함)
  };

  const getInductionStyle = (inductionPk) => {
    if (inductionPk === null)
      return {
        backgroundColor: "#f0f0f0",
        cursor: "default",
        borderColor: "#d0d0d0",
      };
    const statusData = statuses[inductionPk - 1];
    let backgroundColor = "gray";
    let cursor = "pointer";

    if (statusData) {
      if (statusData.is_using === true) backgroundColor = "red";
      else if (statusData.is_available === false) {
        backgroundColor = "yellow";
        cursor = "not-allowed";
      } else backgroundColor = "green";
    }
    return { backgroundColor, cursor };
  };

  return (
    <div className="cook-grid-layout">
      {inductionStations.map((station) => (
        <div key={station.id} className="induction-station-column">
          {station.groups.map((group) => (
            <div
              key={group.id}
              className={`induction-group-container ${
                group.inductions.every((pk) => pk === null) ? "empty-group" : ""
              }`}
            >
              {group.inductions.map((inductionPk, index) => (
                <div
                  key={
                    inductionPk !== null
                      ? `induction-${inductionPk}`
                      : `empty-hob-${station.id}-${group.id}-${index}`
                  }
                  className={`induction-hob ${
                    inductionPk === null ? "empty-hob" : ""
                  }`}
                  style={getInductionStyle(inductionPk)}
                  onClick={() =>
                    inductionPk !== null && handleInductionClick(inductionPk)
                  }
                >
                  {inductionPk !== null ? inductionPk : ""}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}

      {isModalOpen && selectedInduction && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>인덕션 {selectedInduction}번 예약</h2>
            <label htmlFor="date-select">날짜 선택:</label>
            <select
              id="date-select"
              onChange={handleDateChange}
              value={selectedDate || ""}
              disabled={isTimeSlotsLoading}
            >
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

            {selectedDate && (
              <div className="time-slots-container">
                {" "}
                {/* 시간 슬롯 컨테이너 추가 */}
                <h4>{selectedDate} 시간 선택</h4>
                {isTimeSlotsLoading ? (
                  <p className="loading-message">
                    시간 정보를 불러오는 중입니다...
                  </p>
                ) : timeSlots.length > 0 ? (
                  <ul>
                    {timeSlots.map((slot, index) => (
                      <li
                        key={index}
                        style={{
                          color: slot.is_booked
                            ? "red"
                            : slot.is_past
                            ? "grey"
                            : "green",
                          cursor:
                            slot.is_booked || slot.is_past
                              ? "not-allowed"
                              : "pointer",
                          backgroundColor: slot.is_booked
                            ? "#ffdddd"
                            : slot.is_past
                            ? "#f0f0f0"
                            : "#ddffdd",
                        }}
                        onClick={() => {
                          if (
                            !slot.is_booked &&
                            !slot.is_past &&
                            !isTimeSlotsLoading
                          ) {
                            // 로딩 중 클릭 방지
                            reserveSlot(slot.start_time);
                          }
                        }}
                      >
                        {new Date(slot.start_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>예약 가능한 시간대가 없거나 불러올 수 없습니다.</p>
                )}
              </div>
            )}
            <button
              onClick={() => setIsModalOpen(false)}
              className="modal-close-button"
              disabled={isTimeSlotsLoading} // 로딩 중 닫기 버튼 비활성화 (선택 사항)
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CookGrid;
