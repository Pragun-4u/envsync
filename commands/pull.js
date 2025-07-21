import inquirer from "inquirer";
import ora from "ora";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { config } from "../config/config.js";
import {
  decryptEnv,
  getExistingUser,
  getProjectConfig,
  writeConfig,
} from "../utils/index.js";
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

        let projectId = null;
        let selectedProfile = options?.profile;
        let profiles = null;
        let matchedProject = null;

        if (fs.existsSync(projectConfigPath)) {
          const configData = getProjectConfig(projectConfigPath);
          projectId = configData.projectId;
          profiles = configData.profiles;

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
          } else if (!profiles?.[selectedProfile]) {
            console.error(
              `❌ No profile found with name ${selectedProfile}. Run \`envsync init\` first.`
            );
            return;
          }
        } else {
          // Recovery flow
          console.warn("⚠️ Project not linked. Attempting recovery...");

          const spinner = ora("Fetching your cloud projects...").start();
          const allProjects = await envSyncService.listProjectsForUser();
          spinner.stop();

          if (!allProjects || allProjects.length === 0) {
            console.error("❌ No projects found in your account.");
            return;
          }

          try {
            const gitUrl = execSync("git remote get-url origin", {
              stdio: ["pipe", "pipe", "ignore"],
            })
              .toString()
              .trim();

            matchedProject = allProjects.find((p) => p.gitUrl === gitUrl);
          } catch {
            console.warn(
              "⚠️ Git not found or origin not set. Skipping auto-match."
            );
          }

          if (!matchedProject) {
            const { selected } = await inquirer.prompt([
              {
                type: "list",
                name: "selected",
                message: "Select a project to pull:",
                choices: allProjects.map((p) => ({
                  name: p.projectName,
                  value: p,
                })),
              },
            ]);
            matchedProject = selected;
          }

          projectId = matchedProject._id;
          profiles = matchedProject.environments.reduce((acc, env) => {
            acc[env.profileName] = "";
            return acc;
          }, {});

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
          }
        }

        // Prompt for passphrase
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

        const res = pullResponse?.response;

        if (!res?.encryptedEnvData || !res.initializationVector) {
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

        const envPath = path.resolve(process.cwd(), ".env");
        fs.writeFileSync(envPath, decrypted, "utf-8");
        spinner.succeed(".env pulled and written successfully ✅");
        console.log(`Saved to: ${envPath}`);

        // Write .envsync.json if we recovered
        if (!fs.existsSync(projectConfigPath) && matchedProject) {
          const { relink } = await inquirer.prompt([
            {
              type: "confirm",
              name: "relink",
              message: "Do you want to re-link this project for future pulls?",
              default: true,
            },
          ]);

          if (relink) {
            writeConfig(projectConfigPath, {
              projectId,
              gitRemoteUrl: matchedProject.gitRemoteUrl,
              projectName: matchedProject.projectName,
              projectToken: matchedProject.projectToken,
              defaultProfile: selectedProfile,
              profiles,
            });
            console.log("✅ Project re-linked.");
          }
        }
      } catch (err) {
        console.error("❌ Error during pull:", err.message || err);
        process.exit(1);
      }
    });
};
