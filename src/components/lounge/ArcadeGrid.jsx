// src/components/lounge/ArcadeGrid.jsx
import React, { useEffect, useState } from "react";
import "../../styles/ArcadeGrid.css"; // CSS for individual arcade item, not overall grid
import {
  fetchArcadeMachineStatuses,
  fetchArcadeMachineTimeSlots,
  reserveArcadeMachineSlot as reserveArcadeMachineSlotAPI,
} from "../../services/bookingService";

const ArcadeGrid = () => {
  // itemsLayout defines the configuration of arcade machines
  // pk should match the primary key from your backend for these items
  const arcadeMachineDefinitions = [
    { type: "arcadeTable", number: 1, pk: 1, name: "오락기 1" },
    { type: "arcadeTable", number: 2, pk: 2, name: "오락기 2" },
  ];

  const [statuses, setStatuses] = useState([]); // Initialize as empty array
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [isTimeSlotsLoading, setIsTimeSlotsLoading] = useState(false);

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 5; hour < 24; hour++) {
      // 운영시간 05:00 부터
      for (let min = 0; min < 60; min += 30) {
        const hh = String(hour).padStart(2, "0");
        const mm = String(min).padStart(2, "0");
        slots.push(`${hh}:${mm}`);
      }
    }
    // 다음날 00:00, 00:30 추가
    slots.push(`nextDay00:00`);
    slots.push(`nextDay00:30`);
    return slots;
  };

  const reserveSlot = async (startTime) => {
    if (!selectedItem || selectedItem.pk === null) {
      alert("예약할 오락기를 선택해주세요.");
      return;
    }
    setIsTimeSlotsLoading(true);
    try {
      await reserveArcadeMachineSlotAPI(selectedItem.pk, startTime);
      alert("예약이 완료되었습니다.");
      await fetchSlotsForSelectedItem(); // Refresh time slots
      fetchStatuses(); // Refresh item statuses
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

  const fetchSlotsForSelectedItem = async () => {
    if (!selectedDate || !selectedItem || selectedItem.pk === null) return;
    setIsTimeSlotsLoading(true);
    setTimeSlots([]);
    try {
      const res = await fetchArcadeMachineTimeSlots(
        selectedItem.pk,
        selectedDate
      );
      const bookedSet = new Set(
        res.data.map((slot) => {
          const date = new Date(slot.start_time);
          // Ensure consistent time formatting for matching
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
        let fullDateTime;
        let slotDateTime;
        let displayTime = time;

        if (time.startsWith("nextDay")) {
          const actualTime = time.substring(7); // "00:00" or "00:30"
          const nextDayDate = new Date(selectedDate);
          nextDayDate.setDate(new Date(selectedDate).getDate() + 1);
          const nextDayFormatted = `${nextDayDate.getFullYear()}-${String(
            nextDayDate.getMonth() + 1
          ).padStart(2, "0")}-${String(nextDayDate.getDate()).padStart(
            2,
            "0"
          )}`;
          fullDateTime = `${nextDayFormatted}T${actualTime}`;
          displayTime = `다음날 ${actualTime}`;
        } else {
          fullDateTime = `${selectedDate}T${time}`;
        }
        slotDateTime = new Date(fullDateTime);

        const isPast =
          slotDateTime < now &&
          !(
            slotDateTime.getHours() === 0 &&
            (slotDateTime.getMinutes() === 0 ||
              slotDateTime.getMinutes() === 30) &&
            slotDateTime.getDate() === new Date(now).getDate() + 1
          );

        const isBooked = bookedSet.has(fullDateTime);

        return {
          start_time: fullDateTime, // For API
          is_booked: isBooked,
          is_past: isPast,
          display_time: displayTime, // For UI
        };
      });
      setTimeSlots(allSlots);
    } catch (error) {
      console.error("시간 슬롯 불러오기 실패", error);
      setTimeSlots([]);
    } finally {
      setIsTimeSlotsLoading(false);
    }
  };

  const fetchStatuses = async () => {
    try {
      const res = await fetchArcadeMachineStatuses();
      const apiData = res.data;
      // Map definitions to API data
      const newStatuses = arcadeMachineDefinitions.map((def) => {
        const apiStatus = apiData.find((apiItem) => apiItem.pk === def.pk);
        return {
          ...def, // pk, number, name, type from definition
          is_available: apiStatus ? apiStatus.is_available : false, // Default to not available if not found
          is_using: apiStatus ? apiStatus.is_using : false, // Default to not using
          // No 'style' property needed here anymore
        };
      });
      setStatuses(newStatuses);
    } catch (error) {
      console.error("오락기 상태 API 호출 실패", error);
      // Fallback: mark all as unavailable based on definitions
      setStatuses(
        arcadeMachineDefinitions.map((def) => ({
          ...def,
          is_available: false,
          is_using: false,
        }))
      );
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  useEffect(() => {
    if (selectedItem && selectedDate) {
      fetchSlotsForSelectedItem();
    }
  }, [selectedDate, selectedItem]);

  const handleClick = (itemData) => {
    if (!itemData) {
      alert("오락기 정보를 가져오는 중입니다.");
      return;
    }
    if (itemData.is_available === false) {
      alert("이 오락기는 현재 사용할 수 없습니다 (수리중).");
      return;
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const formattedToday = `${year}-${month}-${day}`;

    setSelectedDate(formattedToday);
    setSelectedItem(itemData); // itemData already contains pk, number, name
    setIsModalOpen(true);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  return (
    <div className="arcade-grid-items-container">
      {statuses.map((itemStatus) => {
        if (!itemStatus) return null; // Should not happen if statuses is initialized and populated correctly

        let displayName = itemStatus.name || `오락기 ${itemStatus.number}`;
        let backgroundColor = "gray"; // Default/loading
        let cursor = "pointer";

        if (itemStatus.is_using === true) {
          backgroundColor = "red";
        } else if (itemStatus.is_available === false) {
          backgroundColor = "yellow";
          cursor = "not-allowed";
        } else {
          backgroundColor = "green";
        }

        return (
          <div
            key={itemStatus.pk}
            className={`item-box arcadeTable`} // Use 'arcadeTable' for specific styling if needed
            style={{ backgroundColor, cursor }}
            onClick={() => handleClick(itemStatus)}
          >
            {displayName}
          </div>
        );
      })}

      {isModalOpen && selectedItem && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{selectedItem.name || `오락기 ${selectedItem.number}`} 예약</h2>
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
                <h4>{selectedDate} 시간 선택</h4>
                {isTimeSlotsLoading ? (
                  <p className="loading-message">
                    시간 정보를 불러오는 중입니다...
                  </p>
                ) : timeSlots.length > 0 ? (
                  <ul>
                    {timeSlots.map((slot, idx) => (
                      <li
                        key={idx}
                        style={{
                          color: slot.is_booked
                            ? "red"
                            : slot.is_past
                            ? "grey" /* Ensure this matches CSS if needed */
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
                            reserveSlot(slot.start_time);
                          }
                        }}
                      >
                        {slot.display_time}
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
              disabled={isTimeSlotsLoading}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArcadeGrid;
