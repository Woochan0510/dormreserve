import React, { useEffect, useState } from "react";
import "../../styles/GymPage.css";
import {
  fetchCycleStatuses,
  fetchCycleTimeSlots,
  reserveCycleSlot as reserveCycleSlotAPI,
} from "../../services/bookingService";

const CycleGrid = () => {
  const cycleDefinitions = [
    { type: "cycle", number: 1, pk: 1, name: "사이클 1" },
    { type: "cycle", number: 2, pk: 2, name: "사이클 2" },
    { type: "cycle", number: 3, pk: 3, name: "사이클 3" },
    { type: "cycle", number: 4, pk: 4, name: "사이클 4" },
  ];

  const [statuses, setStatuses] = useState(
    cycleDefinitions.map((def) => ({
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
  const [selectedStartTimeSlot, setSelectedStartTimeSlot] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allGeneratedTimeSlots = getTimeSlots();

  function getTimeSlots() {
    const slots = [];
    // 사이클 및 기타 시설은 05:00 부터 운영 가정
    for (let hour = 5; hour < 24; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const hh = String(hour).padStart(2, "0");
        const mm = String(min).padStart(2, "0");
        slots.push(`${hh}:${mm}`);
      }
    }
    // "다음날" 슬롯 제거
    // slots.push(`nextDay00:00`);
    // slots.push(`nextDay00:30`);
    return slots;
  }

  const handleReserveClick = async () => {
    if (!selectedStartTimeSlot) {
      alert("예약할 시간을 선택해주세요.");
      return;
    }
    setIsTimeSlotsLoading(true);
    try {
      await reserveCycleSlotAPI(
        selectedItem.pk,
        selectedStartTimeSlot.start_time,
        selectedDuration
      );
      alert(`예약이 완료되었습니다. (시간: ${selectedDuration}분)`);
      setSelectedStartTimeSlot(null);
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
    setSelectedStartTimeSlot(null);
    try {
      const res = await fetchCycleTimeSlots(selectedItem.pk, selectedDate);
      const bookedSet = new Set(
        res.data.map((slot) => {
          const date = new Date(slot.start_time);
          // API 응답의 시간을 UTC로 간주하고, 로컬 시간대로 변환하지 않고 그대로 사용
          // YYYY-MM-DDTHH:MM 형식으로 비교하기 위해
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          const hour = String(date.getHours()).padStart(2, "0");
          const minute = String(date.getMinutes()).padStart(2, "0");
          return `${year}-${month}-${day}T${hour}:${minute}`;
        })
      );

      const now = new Date(); // 현재 시각 (로컬)
      const processedSlots = allGeneratedTimeSlots.map((time, index) => {
        // selectedDate는 YYYY-MM-DD 형식, time은 HH:MM 형식
        const fullDateTimeString = `${selectedDate}T${time}:00`; // 초 추가
        const slotDateTime = new Date(fullDateTimeString); // 로컬 시간대로 해석됨

        // isPast 로직 수정: selectedDate가 오늘인지, 이전인지, 미래인지에 따라 다르게 처리
        const today = new Date();
        today.setHours(0, 0, 0, 0); // 오늘 날짜의 시작
        const selectedDateObj = new Date(selectedDate);
        selectedDateObj.setHours(0, 0, 0, 0); // 선택된 날짜의 시작

        let isPast = false;
        if (selectedDateObj < today) {
          // 선택된 날짜가 오늘 이전이면 모두 과거
          isPast = true;
        } else if (selectedDateObj.getTime() === today.getTime()) {
          // 선택된 날짜가 오늘이면 현재 시간과 비교
          isPast = slotDateTime < now;
        }
        // 선택된 날짜가 미래면 isPast는 false (초기값)

        const isBooked = bookedSet.has(`${selectedDate}T${time}`);

        return {
          id: `${selectedDate}-${time}-${selectedItem.pk}-cycle`,
          start_time: `${selectedDate}T${time}`, // API 전송용 (초 제외)
          display_time: time, // 화면 표시용
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
    // (기존 로직과 동일)
    try {
      const res = await fetchCycleStatuses();
      const apiData = res.data;
      const newStatuses = cycleDefinitions.map((def) => {
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
            is_available: false,
            is_using: null,
            isLoading: false,
            fetchFailed: false,
            apiMissing: true,
          };
        }
      });
      setStatuses(newStatuses);
    } catch (error) {
      console.error("사이클 상태 API 호출 실패", error);
      setStatuses(
        cycleDefinitions.map((def) => ({
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedItem, selectedDuration]);

  const handleClick = (itemData) => {
    // (기존 로직과 동일)
    const itemName = itemData.name || `사이클 ${itemData.number}`;
    if (itemData.isLoading) {
      alert("사이클 정보를 가져오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    if (itemData.fetchFailed) {
      alert(`${itemName}의 상태 정보를 불러오지 못했습니다. (API 호출 오류)`);
      return;
    }
    if (itemData.is_using === true) {
      alert(`${itemName}은(는) 현재 사용 중입니다.`);
      return;
    }
    if (
      itemData.is_available === false ||
      (itemData.apiMissing && !itemData.fetchFailed)
    ) {
      alert(`${itemName}은(는) 현재 사용할 수 없습니다 (수리중).`);
      return;
    }
    if (itemData.is_available === null) {
      alert(
        `${itemName}의 상태를 정확히 알 수 없어 예약할 수 없습니다. 새로고침 후 다시 시도해주세요.`
      );
      return;
    }
    if (itemData.is_available === true && !itemData.apiMissing) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const formattedToday = `${year}-${month}-${day}`;

      setSelectedDate(formattedToday);
      setSelectedItem(itemData);
      setSelectedDuration(30);
      setSelectedStartTimeSlot(null);
      setIsModalOpen(true);
    } else {
      alert(`${itemName}의 상태가 예약 가능한 상태가 아닙니다.`);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleDurationChange = (duration) => {
    setSelectedDuration(duration);
    setSelectedStartTimeSlot(null);
  };

  const getStatusStyle = (statusData) => {
    // (기존 로직과 동일)
    let backgroundColor = "#BEBEBE";
    let cursor = "default";
    let textColor = "#333";
    if (statusData) {
      if (statusData.isLoading) {
      } else if (statusData.fetchFailed) {
        backgroundColor = "#D3D3D3";
      } else if (statusData.is_using === true) {
        backgroundColor = "red";
        cursor = "not-allowed";
        textColor = "#fff";
      } else if (
        statusData.is_available === false ||
        (statusData.apiMissing && !statusData.fetchFailed)
      ) {
        backgroundColor = "yellow";
        cursor = "not-allowed";
        textColor = "#333";
      } else if (statusData.is_available === true && !statusData.apiMissing) {
        backgroundColor = "green";
        cursor = "pointer";
        textColor = "#fff";
      }
    }
    return { backgroundColor, cursor, color: textColor };
  };

  return (
    <div className="gym-items-row-container">
      {statuses.map((itemStatus) => {
        const { backgroundColor, cursor, color } = getStatusStyle(itemStatus);
        const itemName = itemStatus.name || `사이클 ${itemStatus.number}`;
        let displayText = itemName;
        if (itemStatus.isLoading) {
          displayText = "로딩중...";
        } else if (itemStatus.fetchFailed) {
          displayText = `${itemName} (상태 확인 실패)`;
        }
        return (
          <div
            key={itemStatus.pk}
            className="item-box cycleTable"
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
            <h2>{selectedItem.name || `사이클 ${selectedItem.number}`} 예약</h2>
            <label htmlFor="date-select-cycle">날짜 선택:</label>
            <select
              id="date-select-cycle"
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
                    {" "}
                    {formattedDate} ({weekday}){" "}
                  </option>
                );
              })}
            </select>

            {selectedDate && (
              <div className="time-slots-container">
                <h4>{selectedDate} 시간 선택</h4>
                {isTimeSlotsLoading ? (
                  <p className="loading-message">
                    {" "}
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
                        // 60분 선택 시 다음 슬롯도 선택 표시 (유효성 검사는 handleTimeSlotClick에서 이미 수행)
                        if (
                          selectedDuration === 60 &&
                          selectedStartTimeSlot.index + 1 === index &&
                          timeSlots[selectedStartTimeSlot.index + 1] && // 다음 슬롯 존재 확인
                          slot.id ===
                            timeSlots[selectedStartTimeSlot.index + 1].id &&
                          !timeSlots[selectedStartTimeSlot.index + 1]
                            .is_booked && // 다음 슬롯이 예약되지 않았는지
                          !timeSlots[selectedStartTimeSlot.index + 1].is_past // 다음 슬롯이 과거가 아닌지
                        ) {
                          className += " time-slot-selected";
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
                      id="duration30-cycle"
                      name="duration-cycle"
                      value="30"
                      checked={selectedDuration === 30}
                      onChange={() => handleDurationChange(30)}
                      disabled={isTimeSlotsLoading}
                    />
                    <label
                      htmlFor="duration30-cycle"
                      className="duration-label"
                    >
                      30분
                    </label>
                  </div>
                  <div>
                    <input
                      type="radio"
                      id="duration60-cycle"
                      name="duration-cycle"
                      value="60"
                      checked={selectedDuration === 60}
                      onChange={() => handleDurationChange(60)}
                      disabled={isTimeSlotsLoading}
                    />
                    <label
                      htmlFor="duration60-cycle"
                      className="duration-label"
                    >
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

export default CycleGrid;
