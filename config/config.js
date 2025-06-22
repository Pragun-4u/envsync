import path from "path";
import os from "os";

export const config = {
  api: {
    baseUrl: process.env.ENVSYNC_API_URL || "http://localhost:3001",
    endpoints: {
      login: "/auth/github",
      logout: "/auth/logout",
      me: "/auth/me",
    },
  },
  storage: {
    configDir: path.join(os.homedir(), ".envsync"),
    configFile: path.join(os.homedir(), ".envsync", "config.json"),
  },
  auth: {
    pollInterval: 2000, // 2 seconds
    pollTimeout: 60000, // 60 seconds
  },
};
