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
        encryptedData,
        iv,
        user: { accessToken },
      } = data;

      const res = await axios.post(
        `${this.apiBaseUrl}${this.endpoints.push}`,
        { encryptedData, iv },
        {
          headers: {
            "x-auth-token": JSON.stringify(accessToken),
            "Content-Type": "application/json",
          },
        }
      );

      return res.data;
    } catch (error) {
      console.log("❌ Error pushing environment variables:", error.message);
    }
  }
}

export default new envSyncService();
