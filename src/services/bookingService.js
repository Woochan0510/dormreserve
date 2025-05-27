import apiClient from "./apiClient";

export const fetchInductionStatuses = async () => {
  return apiClient.get("api/v1/kitchen/inductions/");
};

export const fetchInductionTimeSlots = async (inductionId, date) => {
  return apiClient.get(`api/v1/kitchen/inductions/${inductionId}/timeslots/`, {
    params: { date: date },
  });
};

export const reserveInductionSlot = async (
  inductionId,
  startTime,
  durationMinutes = 30
) => {
  return apiClient.post(`api/v1/kitchen/inductions/${inductionId}/book/`, {
    start_time: startTime,
    duration_minute: durationMinutes,
  });
};
