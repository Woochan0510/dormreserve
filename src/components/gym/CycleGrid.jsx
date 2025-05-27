import { useEffect, useState } from "react";
import "../../styles/CycleGrid.css";
import API_BASE_URL from "../../config/api.js";
import axios from "axios";

const CycleGrid = () => {
  const itemsLayout = [
    {
      type: "cycleTable",
      number: 1,
      pk: 1,
      style: { top: "55%", left: "17%" },
    },
    {
      type: "cycleTable",
      number: 2,
      pk: 2,
      style: { top: "55%", left: "27%" },
    },
    {
      type: "cycleTable",
      number: 3,
      pk: 3,
      style: { top: "55%", left: "37%" },
    },
    {
      type: "cycleTable",
      number: 4,
      pk: 4,
      style: { top: "55 %", left: "47%" },
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
    for (let hour = 0; hour < 1; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const hh = String(hour).padStart(2, "0");
        const mm = String(min).padStart(2, "0");
        slots.push(`nextDay${hh}:${mm}`);
      }
    }
    return slots;
  };

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

  const reserveSlot = async (startTime) => {
    if (!selectedItem || selectedItem.pk === null) {
      alert("예약할 아이템 정보가 불완전합니다.");
      return;
    }

    try {
      await axios.post(
        `${API_BASE_URL}api/v1/cycles/${selectedItem.pk}/book/`,
        {
          start_time: startTime,
          duration_minutes: 30,
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
      const res = await axios.get(
        `${API_BASE_URL}api/v1/gym/cycles/${selectedItem.pk}/timeslots/`,
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
        let fullDateTime;
        let slotDateTime;
        if (time.startsWith("nextDay")) {
          const actualTime = time.substring(7);
          const nextDay = new Date(selectedDate);
          nextDay.setDate(nextDay.getDate() + 1);
          const nextDayFormatted = `${nextDay.getFullYear()}-${String(
            nextDay.getMonth() + 1
          ).padStart(2, "0")}-${String(nextDay.getDate()).padStart(2, "0")}`;
          fullDateTime = `${nextDayFormatted}T${actualTime}`;
          slotDateTime = new Date(fullDateTime);
        } else {
          fullDateTime = `${selectedDate}T${time}`;
          slotDateTime = new Date(fullDateTime);
        }

        const isPast = slotDateTime < now;
        const isBooked = bookedSet.has(fullDateTime);

        return {
          start_time: fullDateTime,
          is_booked: isBooked,
          is_past: isPast,
          display_time: time.startsWith("nextDay")
            ? `다음날 ${time.substring(7)}`
            : time,
          is_next_day: time.startsWith("nextDay"),
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
      const cyclesRes = await axios.get(`${API_BASE_URL}api/v1/gym/cycles/`, {
        headers: {
          "X-CSRFToken": getCookie("csrftoken") || "",
        },
        withCredentials: true,
      });

      const apiData = cyclesRes.data;

      const mergedStatuses = itemsLayout.map((localItem) => {
        const found = apiData.find(
          (apiItem) =>
            apiItem.type === localItem.type &&
            apiItem.number === localItem.number
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
    fetchSlotsForSelectedItem();
  }, [selectedDate, selectedItem]);

  const handleClick = (itemData) => {
    if (!itemData || itemData.is_available === null) {
      alert("아이템 상태를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    if (itemData.is_available === false) {
      alert("이 아이템은 현재 사용할 수 없습니다.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
    <div className="main-grid-container">
      {itemsLayout.map((item, index) => {
        const statusData = statuses[index];

        let displayName = `사이클 ${item.number}`;

        let backgroundColor;
        if (statusData === null) {
          backgroundColor = "gray";
        } else if (!statusData.is_available) {
          backgroundColor = "green"; // 또는 회색
        } else if (statusData.is_using) {
          backgroundColor = "red";
        } else {
          backgroundColor = "green";
        }

        return (
          <div
            key={index}
            className={`item-box ${item.type}`}
            style={{
              ...item.style,
              position: "absolute",
              backgroundColor,
              cursor: "pointer",
            }}
            onClick={() => handleClick(item)}
          >
            {displayName}
          </div>
        );
      })}

      {isModalOpen && selectedItem && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>사이클 {selectedItem.number}번</h2>

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
                      {slot.display_time.includes("nextDay")
                        ? `다음날 ${slot.display_time.replace("nextDay", "")}`
                        : new Date(slot.start_time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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

export default CycleGrid;
