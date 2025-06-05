import React, { useEffect, useState } from "react";
import "../../styles/CookGrid.css";
import {
  fetchInductionStatuses,
  fetchInductionTimeSlots,
  reserveInductionSlot as reserveInductionSlotAPI,
} from "../../services/bookingService";

const CookGrid = () => {
  const inductionStations = [
    {
      id: "station-1-area",
      groups: [
        { id: "group-1-A", inductions: [1, 2] },
        { id: "group-1-B", inductions: [3, 4] },
      ],
    },
    {
      id: "station-2-area",
      groups: [
        { id: "group-2-A", inductions: [5, 6] },
        { id: "group-2-B", inductions: [7, 8] },
      ],
    },
  ];

  const [statuses, setStatuses] = useState(Array(8).fill(null));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInduction, setSelectedInduction] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [isTimeSlotsLoading, setIsTimeSlotsLoading] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [selectedStartTimeSlot, setSelectedStartTimeSlot] = useState(null);

  const allTimeSlots = getTimeSlots();

  function getTimeSlots() {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const hh = String(hour).padStart(2, "0");
        const mm = String(min).padStart(2, "0");
        slots.push(`${hh}:${mm}`);
      }
    }
    return slots;
  }

  const handleReserveClick = async () => {
    if (!selectedStartTimeSlot) {
      alert("예약할 시간을 선택해주세요.");
      return;
    }
    setIsTimeSlotsLoading(true);
    try {
      await reserveInductionSlotAPI(
        selectedInduction,
        selectedStartTimeSlot.start_time,
        selectedDuration
      );
      alert(`예약이 완료되었습니다. (시간: ${selectedDuration}분)`);
      setSelectedStartTimeSlot(null);
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
    } finally {
      setIsTimeSlotsLoading(false);
    }
  };

  const fetchSlotsForSelectedDateAndInduction = async () => {
    if (!selectedDate || !selectedInduction) return;
    setIsTimeSlotsLoading(true);
    setTimeSlots([]);
    setSelectedStartTimeSlot(null);
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
      const processedSlots = allTimeSlots.map((time, index) => {
        const fullDateTime = `${selectedDate}T${time}`;
        const slotDateTime = new Date(fullDateTime);
        const isPast = slotDateTime < now;
        const isBooked = bookedSet.has(fullDateTime);
        return {
          id: `${selectedDate}-${time}`,
          start_time: fullDateTime,
          display_time: time,
          is_booked: isBooked,
          is_past: isPast,
          index: index,
        };
      });
      setTimeSlots(processedSlots);
    } catch (error) {
      console.error("시간 슬롯 불러오기 실패", error);
      setTimeSlots([]);
    } finally {
      setIsTimeSlotsLoading(false);
    }
  };

  const handleTimeSlotClick = (clickedSlot) => {
    if (clickedSlot.is_booked || clickedSlot.is_past || isTimeSlotsLoading) {
      return;
    }

    if (selectedDuration === 60) {
      const nextSlotIndex = clickedSlot.index + 1;
      if (nextSlotIndex < timeSlots.length) {
        const nextSlot = timeSlots[nextSlotIndex];

        const clickedSlotTime = new Date(clickedSlot.start_time);
        const nextSlotTime = new Date(nextSlot.start_time);
        const timeDiff = (nextSlotTime - clickedSlotTime) / (1000 * 60);

        if (timeDiff === 30 && !nextSlot.is_booked && !nextSlot.is_past) {
          setSelectedStartTimeSlot(clickedSlot);
        } else {
          alert("60분 예약의 경우, 연속된 두 개의 빈 슬롯이 필요합니다.");
          setSelectedStartTimeSlot(null);
        }
      } else {
        alert("선택한 시간부터 60분 예약이 불가능합니다 (시간 범위 초과).");
        setSelectedStartTimeSlot(null);
      }
    } else {
      setSelectedStartTimeSlot(clickedSlot);
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
  }, [selectedDate, selectedInduction, selectedDuration]);

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

    setSelectedDate(formattedToday);
    setSelectedInduction(inductionPk);
    setSelectedDuration(30);
    setSelectedStartTimeSlot(null);
    setIsModalOpen(true);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleDurationChange = (duration) => {
    setSelectedDuration(duration);
    setSelectedStartTimeSlot(null);
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
                  {inductionPk !== null ? `인덕션 ${inductionPk}` : ""}
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
            <label htmlFor="date-select-cook">날짜 선택:</label>
            <select
              id="date-select-cook"
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
                <h4>{selectedDate} 시간 선택</h4>
                {isTimeSlotsLoading ? (
                  <p className="loading-message">
                    시간 정보를 불러오는 중입니다...
                  </p>
                ) : timeSlots.length > 0 ? (
                  <ul>
                    {timeSlots.map((slot, index) => {
                      let className = "time-slot-item";
                      if (slot.is_booked) className += " time-slot-booked";
                      else if (slot.is_past) className += " time-slot-past";
                      else className += " time-slot-available";

                      if (selectedStartTimeSlot) {
                        if (slot.id === selectedStartTimeSlot.id) {
                          className += " time-slot-selected";
                        }
                        if (
                          selectedDuration === 60 &&
                          selectedStartTimeSlot.index + 1 === index &&
                          slot.id ===
                            timeSlots[selectedStartTimeSlot.index + 1]?.id
                        ) {
                          if (!slot.is_booked && !slot.is_past) {
                            className += " time-slot-selected";
                          }
                        }
                      }

                      return (
                        <li
                          key={slot.id}
                          className={className}
                          onClick={() => handleTimeSlotClick(slot)}
                        >
                          {slot.display_time}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p>예약 가능한 시간대가 없거나 불러올 수 없습니다.</p>
                )}
              </div>
            )}
            <div className="modal-bottom-controls">
              <div className="duration-select-container">
                <label>예약 시간:</label>
                <div className="duration-options">
                  <div>
                    <input
                      type="radio"
                      id="duration30-cook"
                      name="duration-cook"
                      value="30"
                      checked={selectedDuration === 30}
                      onChange={() => handleDurationChange(30)}
                      disabled={isTimeSlotsLoading}
                    />
                    <label htmlFor="duration30-cook" className="duration-label">
                      30분
                    </label>
                  </div>
                  <div>
                    <input
                      type="radio"
                      id="duration60-cook"
                      name="duration-cook"
                      value="60"
                      checked={selectedDuration === 60}
                      onChange={() => handleDurationChange(60)}
                      disabled={isTimeSlotsLoading}
                    />
                    <label htmlFor="duration60-cook" className="duration-label">
                      60분
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-action-buttons">
                <button
                  className="modal-reserve-button"
                  onClick={handleReserveClick}
                  disabled={!selectedStartTimeSlot || isTimeSlotsLoading}
                >
                  예약하기
                </button>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedStartTimeSlot(null);
                  }}
                  className="modal-close-button"
                  disabled={isTimeSlotsLoading}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CookGrid;
