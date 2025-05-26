import React from "react";
import "./CookGrid.css";
import url from "./url.jsx";
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
            return (
              <div
                key={inductionIndex}
                className="induction"
                style={{
                  ...induction,
                  position: "absolute",
                  cursor: "pointer",
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
