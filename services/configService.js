import fs from "fs";
import path from "path";
import { config } from "../config/config.js";

class ConfigService {
  constructor() {
    this.configDir = config.storage.configDir;
    this.configFile = config.storage.configFile;
    this.ensureConfigDir();
  }

  ensureConfigDir() {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }

  saveUser(userData) {
    try {
      fs.writeFileSync(this.configFile, JSON.stringify(userData, null, 2));
      return true;
    } catch (error) {
      console.error("Failed to save user data:", error.message);
      return false;
    }
  }

  getUser() {
    try {
      if (fs.existsSync(this.configFile)) {
        const data = fs.readFileSync(this.configFile, "utf8");
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error("Failed to read user data:", error.message);
      return null;
    }
  }

  deleteUser() {
    try {
      if (fs.existsSync(this.configFile)) {
        fs.unlinkSync(this.configFile);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to delete user data:", error.message);
      return false;
    }
  }

  isLoggedIn() {
    return this.getUser() !== null;
  }
}

export default new ConfigService();
