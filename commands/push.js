import fs from "fs";
import path from "path";
import crypto from "crypto";
import readline from "readline";
import { config } from "../config/config.js";
import { encryptEnv, getExistingUser } from "../utils/index.js";
import envSyncService from "../services/envSyncService.js";

const INIT_CONFIG_NAME = config.INIT_CONFIG_NAME;
const configFile = config.storage.configFile;
const projectConfigPath = path.join(process.cwd(), INIT_CONFIG_NAME);

const promptPassphrase = () => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.stdoutMuted = true;

    rl.write(" Remember this secret passphrase! \n");
    rl.question("🔑 Enter encryption passphrase: ", (password) => {
      rl.close();
      resolve(password);
    });

    rl._writeToOutput = function _writeToOutput(stringToWrite) {
      if (rl.stdoutMuted) rl.output.write("*");
      else rl.output.write(stringToWrite);
    };
  });
};

export const pushCommand = (program) => {
  program
    .command("push")
    .option("--profile <profile>", "Specify which profile to push")
    .description("Push your environment variables from Local to Cloud")
    .action(async (options) => {
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

        const configData = JSON.parse(
          fs.readFileSync(projectConfigPath, "utf-8")
        );
        const { projectId, defaultProfile, profiles } = configData;

        if (!projectId || !defaultProfile || !profiles?.[defaultProfile]) {
          console.error("❌ No valid project found. Run `envsync init` first.");
          return;
        }

        const selectedProfile = options.profile || defaultProfile;

        if (!profiles[selectedProfile]) {
          console.error(
            `❌ Profile '${selectedProfile}' not found in this project.`
          );
          return;
        }

        const envFilePath = profiles[selectedProfile];

        if (!fs.existsSync(envFilePath)) {
          console.error(`❌ Environment file '${envFilePath}' not found.`);
          return;
        }

        const envContent = fs.readFileSync(envFilePath, "utf-8");
        if (!envContent) {
          console.error("❌ Environment file is empty.");
          return;
        }

        const passphrase = await promptPassphrase();
        console.log("\n");

        const { encryptedData, iv } = encryptEnv(envContent, passphrase);

        const res = await envSyncService.push({
          projectId,
          profileName: selectedProfile,
          encryptedEnvData: encryptedData,
          initializationVector: iv,
          user,
        });

        if (!res) {
          console.error(
            "❌ Failed to push environment variables to the cloud."
          );
          return;
        }

        console.log(
          `✅ Successfully pushed '${selectedProfile}' profile to the cloud!`
        );
      } catch (error) {
        console.error("❌ Error pushing environment variables:", error.message);
      }
    });
};
