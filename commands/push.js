import fs from "fs";
import path from "path";
import crypto from "crypto";
import readline from "readline";
import { config } from "../config/config.js";
import { getExistingUser } from "../utils/index.js";
import envSyncService from "../services/envSyncService.js";

const INIT_CONFIG_NAME = config.INIT_CONFIG_NAME;
const configFile = config.storage.configFile;
const projectConfigPath = path.join(process.cwd(), INIT_CONFIG_NAME);

const getKeyFromPassword = (password) => {
  return crypto.scryptSync(password, "envsync_salt", 32); // 32 bytes for AES-256
};

const encryptEnv = (content, password) => {
  const iv = crypto.randomBytes(16);
  const key = getKeyFromPassword(password);

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(content, "utf-8", "hex");
  encrypted += cipher.final("hex");

  return {
    iv: iv.toString("hex"),
    encryptedData: encrypted,
  };
};

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
      console.log("password", password);
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

        // Prompt for passphrase
        const passphrase = await promptPassphrase();

        // Encrypt the env content
        const { encryptedData, iv } = encryptEnv(envContent, passphrase);
        console.log({ encryptedData, iv });

        // Push encrypted data
        const res = await envSyncService.push({ encryptedData, iv, user });

        if (!res) {
          console.error("❌ Error pushing environment variables.");
          return;
        }

        console.log("✅ Successfully pushed encrypted environment file!");
      } catch (error) {
        console.error("❌ Error pushing environment variables:", error.message);
      }
    });
};
