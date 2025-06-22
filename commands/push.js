import fs from "fs";
import path from "path";
import { config } from "../config/config.js";
import { getExistingUser } from "../common/index.js";
import envSyncService from "../services/envSyncService.js";

const INIT_CONFIG_NAME = config.INIT_CONFIG_NAME;
const configFile = config.storage.configFile;
const projectConfigPath = path.join(process.cwd(), INIT_CONFIG_NAME);

export const pushCommand = (program) => {
  program
    .command("push")
    .description("Push your environment variables from Local to Cloud")
    .action(async () => {
      try {
        const user = getExistingUser(configFile);

        if (!user) {
          console.error("❌ No user logged in. Run `envsync login` first.");
          return;
        }

        if (!fs.existsSync(projectConfigPath)) {
          console.error("❌ No project initialized. Run `envsync init` first.");
          return;
        }

        const config = JSON.parse(fs.readFileSync(projectConfigPath, "utf-8"));
        const { defaultProject, defaultProfile, projects } = config;

        if (!defaultProject || !projects?.[defaultProject]) {
          console.error("❌ No project initialized. Run `envsync init` first.");
          return;
        }

        const envFilePath = projects[defaultProject][defaultProfile];

        if (!fs.existsSync(envFilePath)) {
          console.error(
            "❌ No environment file found. Run `envsync init` first."
          );
          return;
        }

        const envContent = fs.readFileSync(envFilePath, "utf-8");

        if (!envContent) {
          console.error(
            "❌ Environment file is empty. Run `envsync init` first."
          );
          return;
        }

        await envSyncService.push({ envContent, user });
      } catch (error) {
        console.error("❌ Error pushing environment variables:");
      }
    });
};
