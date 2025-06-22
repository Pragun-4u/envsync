import { config } from "../config/config.js";
import axios from "axios";
class envSyncService {
  constructor() {
    this.apiBaseUrl = config.api.baseUrl;
    this.endpoints = config.api.endpoints;
  }

  async push(data) {
    try {
      const {
        envContent,
        user: { accessToken },
      } = data;

      return await axios.post(
        `${this.apiBaseUrl}${this.endpoints.push}`,
        envContent,
        {
          headers: { "x-auth-token": JSON.stringify(accessToken) },
          "Content-Type": "application/json",
        }
      );
    } catch (error) {
      console.log("Error pushing environment variables:", error.message);
    }
  }
}

export default new envSyncService();
