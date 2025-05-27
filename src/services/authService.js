// src/services/authService.js
import apiClient from "./apiClient";

export const loginUser = async (studentIdNumber, password) => {
  // The login request itself might not need the Authorization token yet,
  // but it will be added by apiClient if a previous (expired) token exists.
  // This is generally fine.
  return apiClient.post("api/v1/users/login/", {
    //
    student_id_number: studentIdNumber,
    password: password,
  });
};

export const logoutUser = async () => {
  try {
    const response = await apiClient.post("api/v1/users/logout/", {}); //
    // Clear the token from localStorage on successful logout
    localStorage.removeItem("authToken");
    return response;
  } catch (error) {
    // Even if logout fails on the server, clear the local token
    localStorage.removeItem("authToken");
    console.error(
      "Logout failed, token cleared from local storage anyway.",
      error
    );
    throw error; // Re-throw the error to be handled by the caller
  }
};
