// src/services/authService.js
import apiClient from "./apiClient";

export const loginUser = async (studentIdNumber, password) => {
  return apiClient.post("api/v1/users/login/", {
    student_id_number: studentIdNumber,
    password: password,
  });
};

export const logoutUser = async () => {
  try {
    const response = await apiClient.post("api/v1/users/logout/", {});
    localStorage.removeItem("authToken");
    return response;
  } catch (error) {
    localStorage.removeItem("authToken");
    console.error(
      "Logout failed, token cleared from local storage anyway.",
      error
    );
    throw error;
  }
};

// 새로운 비밀번호 변경 함수
export const changePassword = async (oldPassword, newPassword) => {
  return apiClient.put("api/v1/users/change-password/", {
    old_password: oldPassword,
    new_password: newPassword,
  });
};
