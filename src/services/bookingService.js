import apiClient from "./apiClient";

export const fetchInductionStatuses = async () => {
  return apiClient.get("api/v1/kitchen/inductions/");
};

export const fetchInductionTimeSlots = async (inductionId, date) => {
  return apiClient.get(`api/v1/kitchen/inductions/${inductionId}/timeslots/`, {
    //
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
    duration_minutes: durationMinutes,
  });
};

export const fetchCycleStatuses = async () => {
  return apiClient.get("api/v1/gym/cycles/");
};

export const fetchCycleTimeSlots = async (cycleId, date) => {
  return apiClient.get(`api/v1/gym/cycles/${cycleId}/timeslots/`, {
    params: { date: date },
  });
};

export const reserveCycleSlot = async (
  cycleId,
  startTime,
  durationMinutes = 30
) => {
  return apiClient.post(`api/v1/gym/cycles/${cycleId}/book/`, {
    start_time: startTime,
    duration_minutes: durationMinutes,
  });
};

export const fetchTreadmillStatuses = async () => {
  return apiClient.get("api/v1/gym/treadmills/");
};

export const fetchTreadmillTimeSlots = async (treadmillId, date) => {
  return apiClient.get(`api/v1/gym/treadmills/${treadmillId}/timeslots/`, {
    params: { date: date },
  });
};

export const reserveTreadmillSlot = async (
  treadmillId,
  startTime,
  durationMinutes = 30
) => {
  return apiClient.post(`api/v1/gym/treadmills/${treadmillId}/book/`, {
    start_time: startTime,
    duration_minutes: durationMinutes, // Ensure consistency
  });
};

// Lounge - Arcade Machines
export const fetchArcadeMachineStatuses = async () => {
  return apiClient.get("api/v1/lounge/arcade-machines/");
};

export const fetchArcadeMachineTimeSlots = async (arcadeMachineId, date) => {
  return apiClient.get(
    `api/v1/lounge/arcade-machines/${arcadeMachineId}/timeslots/`,
    {
      params: { date: date },
    }
  );
};

export const reserveArcadeMachineSlot = async (
  arcadeMachineId,
  startTime,
  durationMinutes = 30
) => {
  return apiClient.post(
    `api/v1/lounge/arcade-machines/${arcadeMachineId}/book/`,
    {
      start_time: startTime,
      duration_minutes: durationMinutes, // Ensure consistency
    }
  );
};

// Lounge - Ping Pong Tables
export const fetchPingPongTableStatuses = async () => {
  return apiClient.get("api/v1/lounge/ping-pong-tables/");
};

export const fetchPingPongTableTimeSlots = async (pingPongTableId, date) => {
  return apiClient.get(
    `api/v1/lounge/ping-pong-tables/${pingPongTableId}/timeslots/`,
    {
      params: { date: date },
    }
  );
};

export const reservePingPongTableSlot = async (
  pingPongTableId,
  startTime,
  durationMinutes = 30
) => {
  return apiClient.post(
    `api/v1/lounge/ping-pong-tables/${pingPongTableId}/book/`,
    {
      start_time: startTime,
      duration_minutes: durationMinutes, // Ensure consistency
    }
  );
};
