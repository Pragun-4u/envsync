import httpClient from "../utils/httpClient.js";
import { config } from "../config/config.js";
import configService from "./configService.js";

class AuthService {
  constructor() {
    this.apiBaseUrl = config.api.baseUrl;
    this.endpoints = config.api.endpoints;
  }

  getLoginUrl() {
    return `${this.apiBaseUrl}${this.endpoints.login}`;
  }

  async checkAuthStatus() {
    try {
      const response = await httpClient.get(this.endpoints.me);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        return null;
      }
      throw error;
    }
  }

  async pollForLogin(onSuccess, onError) {
    const startTime = Date.now();
    const { pollInterval, pollTimeout } = config.auth;

    const poll = async () => {
      try {
        const elapsedTime = Date.now() - startTime;

        if (elapsedTime > pollTimeout) {
          onError(new Error("Login timeout - please try again."));
          return;
        }

        const user = await this.checkAuthStatus();

        if (user) {
          configService.saveUser(user);
          onSuccess(user);
        } else {
          setTimeout(poll, pollInterval);
        }
      } catch (error) {
        onError(error);
      }
    };

    poll();
  }

  async logout() {
    try {
      const response = await httpClient.get(this.endpoints.logout);

      if (response.status === 200) {
        return configService.deleteUser();
      }
      return false;
    } catch (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }
  }
}

export default new AuthService();
