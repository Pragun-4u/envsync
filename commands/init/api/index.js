import chalk from "chalk";
import httpClient from "../../../utils/httpClient.js";

export const checkExistingProject = async (gitUrl) => {
  try {
    const res = await httpClient.get("/projects/by-git-url", {
      params: { gitUrl },
    });
    return res.data;
  } catch (error) {
    return null;
  }
};

export const createProjectInCloud = async (projectName, gitRemoteUrl) => {
  try {
    const res = await httpClient.post(`/service/projects`, {
      projectName,
      gitRemoteUrl,
    });
    return res.data;
  } catch (error) {
    console.error(
      chalk.red("❌ Failed to create project in the cloud.", error)
    );
    return null;
  }
};
