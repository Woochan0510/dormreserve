// src/services/apiClient.js
import axios from "axios";
import API_BASE_URL from "../config/api";
// Removed: import { getCookie } from "../utils/cookies"; // If CSRF is no longer needed with Token Auth

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Keep this if your backend relies on cookies for other things or if logout needs it
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const authToken = localStorage.getItem("authToken");

    if (authToken) {
      config.headers["Authorization"] = `Token ${authToken}`;
    }

    // If CSRF is still needed for some requests (e.g., non-token-based or specific Django configurations)
    // you might need to reinstate this part. Otherwise, for pure token auth, it's often not needed.
    // const csrfToken = getCookie("csrftoken");
    // if (csrfToken) {
    //   config.headers["X-CSRFToken"] = csrfToken;
    // }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
