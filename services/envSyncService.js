import { config } from "../config/config.js";
import httpClient from "../utils/httpClient.js";

class envSyncService {
  async push(data) {
    try {
      const {
        projectId,
        profileName,
        encryptedEnvData,
        initializationVector,
        salt,
        authTag,
        filePath,
      } = data;

      const res = await httpClient.post(config.api.endpoints.push, {
        projectId,
        profileName,
        encryptedEnvData,
        initializationVector,
        salt,
        authTag,
        filePath,
      });

      return res.data;
    } catch (error) {
      console.log("❌ Error pushing environment variables:", error.message);
      return null;
    }
  }
  async pull(data) {
    const { projectId, profileName } = data;
    try {
      const res = await httpClient.post(config.api.endpoints.pull, {
        projectId,
        profileName,
      });
      return res.data;
    } catch (error) {
      console.log("❌ Error pulling environment variables:", error.message);
      return null;
    }
  }

  async listProjectsForUser() {
    try {
      const res = await httpClient.get(
        `${config.api.endpoints.listProjectsForUser}`
      );
      return res.data;
    } catch (error) {
      console.log("❌ Error listing projects for user:", error.message);
      return null;
    }
  }
}

export default new envSyncService();
