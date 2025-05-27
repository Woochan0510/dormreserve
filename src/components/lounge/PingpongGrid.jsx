import React, { useEffect, useState } from "react";
import "../../styles/PingpongGrid.css";

import {
  fetchPingPongTableStatuses,
  fetchPingPongTableTimeSlots,
  reservePingPongTableSlot as reservePingPongTableSlotAPI,
} from "../../services/bookingService";

const PingPongGrid = () => {
  const itemsLayout = [
    {
      type: "pingPongTable",
      number: 1,
      pk: 1,
      style: { top: "5%", left: "0%" },
    },
    {
      type: "pingPongTable",
      number: 2,
      pk: 2,
      style: { top: "17%", left: "0%" },
    },
  ];

  const [statuses, setStatuses] = useState(
    Array(itemsLayout.length).fill(null)
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);

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
      alert("예약할 아이템 정보가 불완전합니다.");
      return;
    }
    try {
      await reservePingPongTableSlotAPI(selectedItem.pk, startTime);

      alert("예약이 완료되었습니다.");
      await fetchSlotsForSelectedItem();
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

  const fetchSlotsForSelectedItem = async () => {
    if (!selectedDate || !selectedItem || selectedItem.pk === null) return;
    try {
      const res = await fetchPingPongTableTimeSlots(
        selectedItem.pk,
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

        const isPast = slotDateTime < now;
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
    }
  };

  const fetchStatuses = async () => {
    try {
      const res = await fetchPingPongTableStatuses();

      const apiData = res.data;
      const mergedStatuses = itemsLayout.map((localItem) => {
        const found = apiData.find(
          (apiItem) =>
            apiItem.type === localItem.type &&
            apiItem.number === localItem.number &&
            apiItem.pk === localItem.pk
        );
        return found
          ? { ...localItem, ...found }
          : { ...localItem, is_available: false, is_using: false };
      });
      setStatuses(mergedStatuses);
    } catch (error) {
      console.error("아이템 상태 API 호출 실패", error);
      setStatuses(
        itemsLayout.map((item) => ({
          ...item,
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

  const handleClick = (itemDataFromLayout) => {
    const currentItemStatus = statuses.find(
      (s) => s && s.pk === itemDataFromLayout.pk
    );

    if (!currentItemStatus) {
      alert("아이템 상태를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    if (currentItemStatus.is_available === false) {
      alert("이 아이템은 현재 사용할 수 없습니다 (수리중).");
      return;
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const formattedToday = `${year}-${month}-${day}`;

    setSelectedDate(formattedToday);

    setSelectedItem(currentItemStatus);

    setIsModalOpen(true);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  return (
    <div className="main-grid-container">
      {/* START_MODIFIED_SECTION */}
      {statuses.map((itemStatus, index) => {
        if (!itemStatus) return null;

        let displayName = `탁구대 ${itemStatus.number}`;
        let backgroundColor;

        if (itemStatus.is_using === true) {
          backgroundColor = "red";
        } else if (itemStatus.is_available === false) {
          backgroundColor = "yellow";
        } else {
          backgroundColor = "green";
        }

        return (
          <div
            key={itemStatus.pk || index}
            className={`item-box ${itemStatus.type}`}
            style={{
              ...itemStatus.style,
              position: "absolute",
              backgroundColor,
              cursor:
                itemStatus.is_available === false ? "not-allowed" : "pointer",
            }}
            onClick={() => handleClick(itemStatus)}
          >
            {displayName}
          </div>
        );
      })}
      {/* END_MODIFIED_SECTION */}

      {isModalOpen && selectedItem && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>탁구대 {selectedItem.number}번</h2>
            <select onChange={handleDateChange} value={selectedDate || ""}>
              {Array.from({ length: 7 }).map((_, idx) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dateOption = new Date(today);
                dateOption.setDate(today.getDate() + idx);
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
                  <option key={idx} value={formattedDate}>
                    {formattedDate} ({weekday})
                  </option>
                );
              })}
            </select>

            {selectedDate && (
              <div className="time-slots">
                <h4>{selectedDate}의 시간 선택</h4>
                <ul>
                  {timeSlots.map((slot, idx) => (
                    <li
                      key={idx}
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
                      {slot.display_time}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button onClick={() => setIsModalOpen(false)}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PingPongGrid;
