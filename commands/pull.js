import inquirer from "inquirer";
import ora from "ora";
import { config } from "../config/config.js";
import {
  decryptEnv,
  getExistingUser,
  getProjectConfig,
} from "../utils/index.js";
import path from "path";
import fs from "fs";
import envSyncService from "../services/envSyncService.js";

const INIT_CONFIG_NAME = config.INIT_CONFIG_NAME;
const configFile = config.storage.configFile;
const projectConfigPath = path.join(process.cwd(), INIT_CONFIG_NAME);

export const pullCommand = async (program) => {
  program
    .command("pull")
    .option("--profile <selectedProfile>", "Specify which profile to pull")
    .description("Pull your environment variables from Cloud to Local")
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
        const configData = getProjectConfig(projectConfigPath);
        const { projectId, defaultProfile, profiles } = configData;

        let selectedProfile = options?.profile;

        if (!selectedProfile) {
          const { profile } = await inquirer.prompt([
            {
              type: "list",
              name: "profile",
              message: "Select a profile to pull:",
              choices: Object.keys(profiles),
            },
          ]);
          selectedProfile = profile;
        } else {
          if (!profiles?.[selectedProfile]) {
            console.error(
              `❌ No profile found with name ${selectedProfile}. Run \`envsync init\` first.`
            );
            return;
          }
        }

        const { passphrase } = await inquirer.prompt([
          {
            type: "password",
            name: "passphrase",
            message: "Enter your passphrase to decrypt the environment:",
            mask: "*",
          },
        ]);

        const spinner = ora("Fetching environment variables...").start();

        const pullResponse = await envSyncService.pull({
          projectId,
          profileName: selectedProfile,
        });

        if (!pullResponse.response) {
          spinner.fail("No environment data found.");
          return;
        }

        const res = pullResponse.response;

        if (!res || !res.encryptedEnvData || !res.initializationVector) {
          spinner.fail("No environment data found.");
          return;
        }

        const decrypted = decryptEnv(
          res.encryptedEnvData,
          passphrase,
          res.salt,
          res.initializationVector,
          res.authTag
        );

        if (!decrypted) {
          spinner.fail("Failed to decrypt environment variables.");
          return;
        }

        console.log(decrypted);

        const envPath = path.resolve(process.cwd(), ".env");
        fs.writeFileSync(envPath, decrypted, "utf-8");

        spinner.succeed(".env pulled and written successfully ✅");
        console.log(`Saved to: ${envPath}`);
      } catch (err) {
        console.error("❌ Error during pull:", err.message || err);
      }
    });
};
