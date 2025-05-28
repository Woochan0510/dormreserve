// src/components/gym/TreadMillGrid.jsx
import React, { useEffect, useState } from "react";
import "../../styles/TreadMillGrid.css"; // Specific styles for treadmill items if needed
import {
  fetchTreadmillStatuses,
  fetchTreadmillTimeSlots,
  reserveTreadmillSlot as reserveTreadmillSlotAPI,
} from "../../services/bookingService";

const TreadMillGrid = () => {
  const treadmillDefinitions = [
    { type: "treadmill", number: 1, pk: 1, name: "트레드밀 1" },
    { type: "treadmill", number: 2, pk: 2, name: "트레드밀 2" },
    { type: "treadmill", number: 3, pk: 3, name: "트레드밀 3" },
    { type: "treadmill", number: 4, pk: 4, name: "트레드밀 4" },
    { type: "treadmill", number: 5, pk: 5, name: "트레드밀 5" },
    { type: "treadmill", number: 6, pk: 6, name: "트레드밀 6" },
  ];

  const [statuses, setStatuses] = useState(
    treadmillDefinitions.map((def) => ({
      ...def,
      is_available: null,
      is_using: null,
      isLoading: true,
    }))
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [isTimeSlotsLoading, setIsTimeSlotsLoading] = useState(false);

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 5; hour < 24; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const hh = String(hour).padStart(2, "0");
        const mm = String(min).padStart(2, "0");
        slots.push(`${hh}:${mm}`);
      }
    }
    slots.push(`nextDay00:00`);
    slots.push(`nextDay00:30`);
    return slots;
  };

  const reserveSlot = async (startTime) => {
    if (!selectedItem || selectedItem.pk === null) {
      alert("예약할 트레드밀을 선택해주세요.");
      return;
    }
    setIsTimeSlotsLoading(true);
    try {
      await reserveTreadmillSlotAPI(selectedItem.pk, startTime);
      alert("예약이 완료되었습니다.");
      await fetchSlotsForSelectedItem();
      fetchStatuses(); // 상태 새로고침
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
      const res = await fetchTreadmillTimeSlots(selectedItem.pk, selectedDate);
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
        let fullDateTime;
        let slotDateTime;
        let displayTime = time;

        if (time.startsWith("nextDay")) {
          const actualTime = time.substring(7);
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
          start_time: fullDateTime,
          is_booked: isBooked,
          is_past: isPast,
          display_time: displayTime,
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
      const res = await fetchTreadmillStatuses();
      const apiData = res.data;
      const newStatuses = treadmillDefinitions.map((def) => {
        // API 응답에 type 필드가 없으므로 pk로만 매칭합니다.
        const apiStatus = apiData.find((apiItem) => apiItem.pk === def.pk);
        return {
          ...def,
          is_available: apiStatus ? apiStatus.is_available : null,
          is_using: apiStatus ? apiStatus.is_using : null,
          isLoading: false,
          apiMissing: !apiStatus,
        };
      });
      setStatuses(newStatuses);
    } catch (error) {
      console.error("트레드밀 상태 API 호출 실패", error);
      setStatuses(
        treadmillDefinitions.map((def) => ({
          ...def,
          is_available: null,
          is_using: null,
          isLoading: false,
          fetchFailed: true,
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
    if (itemData.isLoading || itemData.fetchFailed || itemData.apiMissing) {
      alert("트레드밀 정보를 가져오는 중이거나 상태를 확인할 수 없습니다.");
      return;
    }
    if (itemData.is_available === false) {
      alert("이 트레드밀은 현재 사용할 수 없습니다 (수리중).");
      return;
    }
    if (itemData.is_available === null) {
      alert(
        "트레드밀 상태를 확인할 수 없습니다. 새로고침 후 다시 시도해주세요."
      );
      return;
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const formattedToday = `${year}-${month}-${day}`;

    setSelectedDate(formattedToday);
    setSelectedItem(itemData);
    setIsModalOpen(true);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  return (
    <div className="gym-items-row-container">
      {statuses.map((itemStatus) => {
        let backgroundColor = "#BEBEBE"; // Medium gray for loading
        let textColor = "#333333"; // Dark gray text
        let cursor = "default";
        const itemName = itemStatus.name || `트레드밀 ${itemStatus.number}`;
        let displayText = itemName;

        if (itemStatus.isLoading) {
          displayText = "로딩중...";
          cursor = "wait";
        } else if (itemStatus.fetchFailed || itemStatus.apiMissing) {
          displayText = `${itemName} (상태 확인 실패)`;
          backgroundColor = "#D3D3D3"; // Light gray for error
        } else if (itemStatus.is_available === false) {
          backgroundColor = "yellow";
        } else if (itemStatus.is_using === true) {
          backgroundColor = "red";
          textColor = "#FFFFFF";
        } else if (itemStatus.is_available === true) {
          backgroundColor = "green";
          textColor = "#FFFFFF";
          cursor = "pointer";
        }
        return (
          <div
            key={itemStatus.pk}
            className={`item-box cycleTable`}
            style={{ backgroundColor, cursor, color: textColor }}
            onClick={() => {
              if (
                itemStatus.is_available === true &&
                !itemStatus.isLoading &&
                !itemStatus.fetchFailed &&
                !itemStatus.apiMissing
              ) {
                handleClick(itemStatus);
              } else if (itemStatus.is_available === false) {
                alert(`이 ${itemName}(은)는 현재 사용할 수 없습니다 (수리중).`);
              }
            }}
          >
            {displayText}
          </div>
        );
      })}

      {isModalOpen && selectedItem && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>
              {selectedItem.name || `트레드밀 ${selectedItem.number}`} 예약
            </h2>
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

export default TreadMillGrid;
