import apiClient from "./apiClient";

export const loginUser = async (studentIdNumber, password) => {
  return apiClient.post("api/v1/users/login/", {
    student_id_number: studentIdNumber,
    password: password,
  });
};

export const logoutUser = async () => {
  return apiClient.post("api/v1/users/logout/", {});
};
