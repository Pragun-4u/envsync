// src/utils/httpClient.js
import axios from "axios";
import { config } from "../config/config.js";
import { getExistingUser } from "./index.js";

const httpClient = axios.create({
  baseURL: config.api.baseUrl,
  headers: { "Content-Type": "application/json" },
});

httpClient.interceptors.request.use(
  (request) => {
    const user = getExistingUser(config.storage.configFile);

    if (user) {
      request.headers["x-auth-token"] = JSON.stringify(user.accessToken);
    }

    return request;
  },
  (error) => Promise.reject(error)
);

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("❌ Unauthorized. Please login again.");
    } else if (error.response?.status === 500) {
      console.error("❌ Server error. Try again later.");
    } else {
      console.error("❌ Request failed:", error.message);
    }

    return Promise.reject(error);
  }
);

export default httpClient;
