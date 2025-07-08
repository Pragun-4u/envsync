import { config } from "../config/config.js";
import httpClient from "../utils/httpClient.js";

class envSyncService {
  async push(data) {
    try {
      const { projectId, profileName, encryptedEnvData, initializationVector } =
        data;

      const res = await httpClient.post(config.api.endpoints.push, {
        projectId,
        profileName,
        encryptedEnvData,
        initializationVector,
      });

      return res.data;
    } catch (error) {
      console.log("❌ Error pushing environment variables:", error.message);
      return null;
    }
  }
}

export default new envSyncService();
