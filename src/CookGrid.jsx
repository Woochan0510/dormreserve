import React, { useEffect, useState } from "react";
import "./CookGrid.css"; // CookGrid.css 파일이 같은 디렉토리에 있다고 가정합니다.
import url from "./util.jsx"; // util.jsx 파일이 같은 디렉토리에 있다고 가정합니다.
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
  const [statuses, setStatuses] = useState(Array(8).fill(null)); // 8개의 인덕션 상태 (null: 로딩 중, true: 사용 가능, false: 사용 불가능)
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달 창 열림/닫힘 상태
  const [selectedInduction, setSelectedInducion] = useState(null); // 선택된 인덕션 번호
  const [selectedDate, setSelectedDate] = useState(null); // 선택된 날짜
  const [timeSlots, setTimeSlots] = useState([]); // 특정 날짜의 시간 슬롯 정보

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
        // 쿠키 이름이 일치하면 값을 디코딩하여 반환
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
      // API에 예약 요청 (POST)
      await axios.post(
        `${url}api/v1/kitchen/inductions/${selectedInduction}/book/`,
        {
          start_time: startTime,
          duration_minute: 30, // 예약 시간 단위: 30분
        },
        {
          headers: {
            "X-CSRFToken": getCookie("csrftoken") || "", // CSRF 토큰 전송
            "Content-Type": "application/json", // JSON 형식으로 데이터 전송 명시
          },
          withCredentials: true, // 크로스-도메인 요청 시 쿠키 전송 허용
        }
      );

      alert("예약이 완료되었습니다.");

      // 예약 성공 후, 최신 시간 슬롯 상태를 다시 불러옵니다.
      // fetchSlots 함수를 호출하여 중복 코드 제거 및 로직 일관성 유지
      await fetchSlotsForSelectedDateAndInduction();
    } catch (error) {
      console.error("예약 실패:", error); // 디버깅을 위해 에러 전체를 콘솔에 출력
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
        `${url}api/v1/kitchen/inductions/${selectedInduction}/timeslots/`,
        {
          params: { date: selectedDate }, // 쿼리 파라미터로 선택된 날짜 전송
          withCredentials: true,
          headers: {
            "X-CSRFToken": getCookie("csrftoken") || "",
          },
        }
      );

      // API 응답에서 예약된 시간들을 Set으로 저장
      // 핵심 수정: API에서 받은 시간도 'YYYY-MM-DDTHH:MM' 형식으로 맞춰서 비교
      const bookedSet = new Set(
        res.data.map((slot) => {
          // Date 객체 생성 후, local time string으로 변환
          const date = new Date(slot.start_time);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          const hour = String(date.getHours()).padStart(2, "0");
          const minute = String(date.getMinutes()).padStart(2, "0");
          return `${year}-${month}-${day}T${hour}:${minute}`;
        })
      );

      const now = new Date(); // 현재 시각

      // 모든 시간 슬롯을 생성하고, 예약 여부 및 지난 시간 여부를 표시합니다.
      const allSlots = getTimeSlots().map((time) => {
        const fullDateTime = `${selectedDate}T${time}`; // 예: "2023-05-27T10:00"
        const slotDateTime = new Date(fullDateTime); // 해당 슬롯의 Date 객체

        const isPast = slotDateTime < now; // 슬롯 시간이 현재 시간보다 이전인지 확인
        const isBooked = bookedSet.has(fullDateTime); // 해당 슬롯이 예약되었는지 확인

        return {
          start_time: fullDateTime,
          is_booked: isBooked,
          is_past: isPast,
        };
      });

      setTimeSlots(allSlots); // 시간 슬롯 상태 업데이트
    } catch (error) {
      console.error("시간 슬롯 불러오기 실패", error);
    }
  };

  // 컴포넌트 마운트 시 인덕션 상태를 초기 로딩합니다.
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const res = await axios.get(`${url}api/v1/kitchen/inductions/`, {
          headers: {
            "X-CSRFToken": getCookie("csrftoken") || "",
          },
          withCredentials: true,
        });
        const apiData = res.data;

        // API에서 받은 인덕션 데이터를 pk(기본키)에 따라 정렬하여 상태에 반영합니다.
        const sortedStatuses = Array(8).fill(null);
        apiData.forEach((item) => {
          const index = item.pk - 1; // pk는 1부터 시작하므로 0부터 시작하는 배열 인덱스로 변환
          if (index >= 0 && index < 8) {
            sortedStatuses[index] = item.is_available; // 사용 가능 여부
          }
        });

        setStatuses(sortedStatuses); // 인덕션 상태 업데이트
      } catch (error) {
        console.error("인덕션 상태 API 호출 실패", error);
      }
    };

    fetchStatuses();
  }, []); // 빈 의존성 배열은 컴포넌트가 처음 마운트될 때만 실행됨을 의미합니다.

  // selectedDate 또는 selectedInduction이 변경될 때마다 해당 날짜의 시간 슬롯을 불러옵니다.
  useEffect(() => {
    fetchSlotsForSelectedDateAndInduction();
  }, [selectedDate, selectedInduction]); // selectedDate나 selectedInduction이 변경될 때마다 실행됩니다.

  let globalInductionNumber = 1; // 인덕션 번호를 전역적으로 관리 (렌더링 시 순차적으로 증가)

  // 인덕션 클릭 시 호출되는 함수
  const handleClick = (inductionNumber) => {
    const status = statuses[inductionNumber - 1]; // 선택된 인덕션의 현재 상태

    if (status === false) {
      alert("이 인덕션은 현재 사용할 수 없습니다.");
      return;
    }

    if (status === true) {
      // 오늘 날짜를 'YYYY-MM-DD' 형식으로 정확히 가져오기 (타임존 문제 방지)
      const today = new Date();
      // 날짜만 정확히 맞추기 위해 시간을 00:00:00으로 설정
      today.setHours(0, 0, 0, 0);

      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0"); // 월은 0부터 시작하므로 +1
      const day = String(today.getDate()).padStart(2, "0");
      const formattedToday = `${year}-${month}-${day}`;

      setSelectedDate(formattedToday); // 모달 열릴 때 초기 날짜를 오늘로 설정
      setSelectedInducion(inductionNumber); // 선택된 인덕션 번호 설정
      setIsModalOpen(true); // 모달 열기
    }
  };

  // 날짜 선택 드롭다운 변경 시 호출되는 함수
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value); // 선택된 날짜로 상태 업데이트
  };

  return (
    <div className="grid-container">
      {/* 테이블 레이아웃을 매핑하여 인덕션들을 배치합니다. */}
      {tables.map((items, tableIndex) => (
        <div className="table" key={tableIndex}>
          {items.map((induction, inductionIndex) => {
            const number = globalInductionNumber++; // 인덕션 번호 자동 증가
            const status = statuses[number - 1]; // 해당 인덕션의 현재 상태

            // 인덕션 상태에 따라 배경색 결정
            const backgroundColor =
              status === null ? "gray" : status ? "green" : "red";

            return (
              <div
                key={inductionIndex}
                className="induction"
                style={{
                  ...induction, // 테이블 배열에서 정의된 위치 스타일
                  position: "absolute", // 절대 위치 지정
                  cursor: "pointer", // 마우스 커서를 포인터로 변경
                  backgroundColor, // 상태에 따른 배경색
                }}
                onClick={() => handleClick(number)} // 인덕션 클릭 이벤트 핸들러
              >
                {number} {/* 인덕션 번호 표시 */}
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
                today.setHours(0, 0, 0, 0); // 오늘 날짜의 00:00:00으로 설정 (타임존 오류 방지)

                const dateOption = new Date(today);
                dateOption.setDate(today.getDate() + index); // 오늘부터 7일간의 날짜를 생성

                const year = dateOption.getFullYear();
                const month = String(dateOption.getMonth() + 1).padStart(
                  2,
                  "0"
                );
                const day = String(dateOption.getDate()).padStart(2, "0");
                const formattedDate = `${year}-${month}-${day}`; // 'YYYY-MM-DD' 형식

                const weekday = dateOption.toLocaleDateString("ko-KR", {
                  weekday: "short", // 요일 (예: "월", "화")
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
                        // 슬롯 상태에 따른 색상 변경 로직
                        color: slot.is_booked // 예약된 시간은 빨간색
                          ? "red"
                          : slot.is_past // 지난 시간은 회색
                          ? "gray"
                          : "green", // 예약 가능 시간은 초록색
                        // 예약 불가능하거나 지난 시간은 커서 변경 및 클릭 방지
                        cursor:
                          slot.is_booked || slot.is_past
                            ? "not-allowed"
                            : "pointer",
                      }}
                      onClick={() => {
                        // 예약 불가능한 시간(이미 예약되었거나 지난 시간)은 클릭 안 되도록
                        if (!slot.is_booked && !slot.is_past) {
                          reserveSlot(slot.start_time); // 예약 함수 호출
                        }
                      }}
                    >
                      {new Date(slot.start_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      {/* 시간만 표시 (예: "10:00") */}
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
