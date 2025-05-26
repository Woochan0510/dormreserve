import React, { useEffect, useState } from "react";
import "./CookGrid.css";
import url from "./util.jsx";
import axios from "axios";

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
    console.log(cookieValue);

    return cookieValue;
  }

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const res = await axios.get(url + `api/v1/kitchen/inductions/`, {
          headers: {
            "X-CSRFToken": getCookie("csrftoken") || "",
          },
          withCredentials: true,
        });
        const apiData = res.data;

        const sortedStatuses = Array(8).fill(null);
        apiData.forEach((item) => {
          const index = item.pk - 1;
          if (index >= 0 && index < 8) {
            sortedStatuses[index] = item.is_available;
          }
        });

        setStatuses(sortedStatuses);
      } catch (error) {
        console.error("API 호출 실패", error);
      }
    };

    fetchStatuses();
  }, []);

  let globalInductionNumber = 1;

  const handleClick = (inductionNumber) => {
    console.log(`Clicked induction ${inductionNumber}`);
  };

  return (
    <div className="grid-container">
      {tables.map((items, tableIndex) => (
        <div className="table" key={tableIndex}>
          {items.map((induction, inductionIndex) => {
            const number = globalInductionNumber++;
            const status = statuses[number - 1];
            const backgroundColor =
              status === null ? "gray" : status ? "green" : "red";

            return (
              <div
                key={inductionIndex}
                className="induction"
                style={{
                  ...induction,
                  position: "absolute",
                  cursor: "pointer",
                  backgroundColor,
                }}
                onClick={() => handleClick(number)}
              >
                {number}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default CookGrid;
