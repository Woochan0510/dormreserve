import React, { useEffect, useState } from "react";
import "../../styles/GymPage.css"; // TreadMillGrid.css 대신 GymPage.css를 사용하도록 변경
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
      fetchFailed: false,
      apiMissing: false,
    }))
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [isTimeSlotsLoading, setIsTimeSlotsLoading] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(30);

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
      await reserveTreadmillSlotAPI(
        selectedItem.pk,
        startTime,
        selectedDuration
      );
      alert(`예약이 완료되었습니다. (시간: ${selectedDuration}분)`);
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

        const isTodaySelected =
          new Date(selectedDate).toDateString() === new Date().toDateString();
        let isPast;
        if (time.startsWith("nextDay")) {
          isPast = false;
        } else {
          isPast = isTodaySelected && slotDateTime < now;
        }

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
        const apiStatus = apiData.find((apiItem) => apiItem.pk === def.pk);
        if (apiStatus) {
          return {
            ...def,
            is_available: apiStatus.is_available,
            is_using: apiStatus.is_using,
            isLoading: false,
            fetchFailed: false,
            apiMissing: false,
          };
        } else {
          return {
            ...def,
            is_available: false, // API에 정보가 없으면 기본적으로 사용 불가(수리중)로 간주
            is_using: null,
            isLoading: false,
            fetchFailed: false,
            apiMissing: true,
          };
        }
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
          apiMissing: false,
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
    const itemName = itemData.name || `트레드밀 ${itemData.number}`;

    if (itemData.isLoading) {
      alert("트레드밀 정보를 가져오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    if (itemData.fetchFailed) {
      alert(`${itemName}의 상태 정보를 불러오지 못했습니다. (API 오류)`);
      return;
    }
    if (itemData.is_using === true) {
      // is_using이 true면 항상 사용 중 알림
      alert(`${itemName}은(는) 현재 사용 중입니다.`);
      return;
    }

    if (
      itemData.is_available === false || // is_available이 false이거나
      (itemData.apiMissing && !itemData.fetchFailed) // API에 데이터가 없는 경우
    ) {
      alert(`이 ${itemName}은(는) 현재 사용할 수 없습니다 (수리중).`);
      return;
    }
    if (itemData.is_available === null) {
      // is_available이 null인 경우 (초기 상태 또는 API 호출 실패)
      alert(
        `${itemName}의 상태를 확인할 수 없습니다. 새로고침 후 다시 시도해주세요.`
      );
      return;
    }

    if (itemData.is_available === true && !itemData.apiMissing) {
      // is_available이 true이고, API에 데이터가 있는 경우
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const formattedToday = `${year}-${month}-${day}`;

      setSelectedDate(formattedToday);
      setSelectedItem(itemData);
      setSelectedDuration(30);
      setIsModalOpen(true);
    } else {
      alert(`${itemName}의 상태가 예약 가능한 상태가 아닙니다.`);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const getStatusStyle = (statusData) => {
    let backgroundColor = "#BEBEBE"; // 기본 로딩/알수없음 색상
    let cursor = "default";
    let textColor = "#333"; // 기본 텍스트 색상

    if (statusData) {
      if (statusData.isLoading) {
        // 로딩 중 스타일은 기본값 유지
      } else if (statusData.fetchFailed) {
        backgroundColor = "#D3D3D3"; // 에러 시 연한 회색
      } else if (statusData.is_using === true) {
        backgroundColor = "red";
        cursor = "not-allowed";
        textColor = "#FFFFFF"; // 흰색 텍스트
      } else if (
        statusData.is_available === false ||
        (statusData.apiMissing && !statusData.fetchFailed)
      ) {
        backgroundColor = "yellow"; // 수리중 또는 API 정보 누락
        cursor = "not-allowed";
        textColor = "#333333"; // 검은색 텍스트
      } else if (statusData.is_available === true && !statusData.apiMissing) {
        backgroundColor = "green";
        cursor = "pointer";
        textColor = "#FFFFFF"; // 흰색 텍스트
      }
    }
    return { backgroundColor, cursor, color: textColor };
  };

  return (
    <div className="gym-items-row-container">
      {" "}
      {/* GymPage.css의 스타일 사용 */}
      {statuses.map((itemStatus) => {
        const { backgroundColor, cursor, color } = getStatusStyle(itemStatus);
        const itemName = itemStatus.name || `트레드밀 ${itemStatus.number}`;
        let displayText = itemName;

        if (itemStatus.isLoading) {
          displayText = "로딩중...";
        } else if (itemStatus.fetchFailed) {
          displayText = `${itemName} (상태 확인 실패)`;
        } else if (itemStatus.apiMissing && !itemStatus.fetchFailed) {
          //  displayText = `${itemName} (수리중)`; // API 데이터 없는 경우 '수리중'으로 표시
        }

        return (
          <div
            key={itemStatus.pk}
            className={`item-box cycleTable`} // GymPage.css의 cycleTable 클래스 재활용 또는 treadmillTable 클래스 추가 정의
            style={{ backgroundColor, cursor, color }}
            onClick={() => handleClick(itemStatus)}
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
                            slot.is_booked || slot.is_past || isTimeSlotsLoading
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
            <div className="modal-bottom-controls">
              <div className="duration-select-container">
                <label>예약 시간:</label>
                <div className="duration-options">
                  <div>
                    <input
                      type="radio"
                      id="duration30-treadmill"
                      name="duration-treadmill"
                      value="30"
                      checked={selectedDuration === 30}
                      onChange={() => setSelectedDuration(30)}
                      disabled={isTimeSlotsLoading}
                    />
                    <label
                      htmlFor="duration30-treadmill"
                      className="duration-label"
                    >
                      30분
                    </label>
                  </div>
                  <div>
                    <input
                      type="radio"
                      id="duration60-treadmill"
                      name="duration-treadmill"
                      value="60"
                      checked={selectedDuration === 60}
                      onChange={() => setSelectedDuration(60)}
                      disabled={isTimeSlotsLoading}
                    />
                    <label
                      htmlFor="duration60-treadmill"
                      className="duration-label"
                    >
                      60분
                    </label>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="modal-close-button"
                disabled={isTimeSlotsLoading}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreadMillGrid;
