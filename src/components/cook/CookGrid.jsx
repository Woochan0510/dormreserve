import React, { useEffect, useState } from "react";
import "../../styles/CookGrid.css";
import {
  fetchInductionStatuses,
  fetchInductionTimeSlots,
  reserveInductionSlot as reserveInductionSlotAPI,
} from "../../services/bookingService";

const CookGrid = () => {
  const tables = [
    [
      { top: "10%", left: "10%" },
      { bottom: "10%", right: "10%" },
    ],
    [
      { top: "10%", left: "30%" },
      { bottom: "10%", left: "30%" },
    ],
    [],
    [
      { top: "20%", left: "10%" },
      { bottom: "10%", right: "10%" },
    ],
    [
      { top: "10%", left: "30%" },
      { bottom: "10%", left: "30%" },
    ],
    [],
  ];

  const [statuses, setStatuses] = useState(Array(8).fill(null));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInduction, setSelectedInduction] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);

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
      setTimeSlots([]);
    }
  };

  const fetchStatuses = async () => {
    try {
      const res = await fetchInductionStatuses();

      const apiData = res.data;
      const sortedStatuses = Array(8).fill(null);
      apiData.forEach((item) => {
        const index = item.pk - 1;
        if (index >= 0 && index < 8) {
          sortedStatuses[index] = {
            pk: item.pk,
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
    if (selectedInduction && selectedDate) {
      fetchSlotsForSelectedDateAndInduction();
    }
  }, [selectedDate, selectedInduction]);

  let globalInductionNumber = 1;

  const handleClick = (inductionPk) => {
    const statusData = statuses[inductionPk - 1];

    if (!statusData) {
      alert("인덕션 상태를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    if (statusData.is_available === false) {
      alert("이 인덕션은 현재 사용할 수 없습니다.");
      return;
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const formattedToday = `${year}-${month}-${day}`;

    setSelectedDate(formattedToday);

    setSelectedInduction(inductionPk);

    setIsModalOpen(true);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  return (
    <div className="grid-container">
      {tables.map((items, tableIndex) => (
        <div className="table" key={tableIndex}>
          {items.map((induction, inductionIndex) => {
            const currentInductionNumber = globalInductionNumber++;
            const statusData = statuses[currentInductionNumber - 1];

            let backgroundColor;
            if (statusData === null) {
              backgroundColor = "gray";
            } else if (statusData.is_using === true) {
              backgroundColor = "red";
            } else if (statusData.is_available === false) {
              backgroundColor = "red";
            } else {
              backgroundColor = "green";
            }

            return (
              <div
                key={inductionIndex}
                className="induction"
                style={{
                  ...induction,
                  position: "absolute",
                  cursor:
                    statusData && statusData.is_available === false
                      ? "not-allowed"
                      : "pointer",
                  backgroundColor,
                }}
                onClick={() => handleClick(currentInductionNumber)}
              >
                {currentInductionNumber}
              </div>
            );
          })}
        </div>
      ))}

      {isModalOpen && selectedInduction && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>인덕션 {selectedInduction}번</h2>
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

export default CookGrid;
