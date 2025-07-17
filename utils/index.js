import { execSync } from "child_process";
import crypto from "crypto";
import fs from "fs";

// Read the current logged-in user
const getExistingUser = (configFile) => {
  if (!fs.existsSync(configFile)) return null;

  const stats = fs.statSync(configFile);
  if (stats.isDirectory()) {
    console.error("❌ config.json is a directory, expected a file.");
    return null;
  }

  try {
    const existingUser = JSON.parse(fs.readFileSync(configFile, "utf-8"));
    return existingUser;
  } catch (e) {
    console.error("❌ Could not parse config.json:", e.message);
    return null;
  }
};

const getGitRemoteUrl = () => {
  try {
    const url = execSync("git config --get remote.origin.url")
      .toString()
      .trim();
    return url || null;
  } catch (error) {
    return null;
  }
};

const getKeyFromPassword = (password) => {
  return crypto.scryptSync(password, "envsync_salt", 32);
};

const encryptEnv = (content, password) => {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.scryptSync(password, salt, 32);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(content, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encryptedData: encrypted.toString("hex"),
    salt: salt.toString("hex"),
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
};

const decryptEnv = (encryptedData, password, saltHex, ivHex, authTagHex) => {
  const salt = Buffer.from(saltHex, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const key = crypto.scryptSync(password, salt, 32);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedData, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
};

const getProjectConfig = (projectConfigPath) => {
  const configData = JSON.parse(fs.readFileSync(projectConfigPath, "utf-8"));
  return configData;
};
export {
  encryptEnv,
  getExistingUser,
  getGitRemoteUrl,
  getKeyFromPassword,
  decryptEnv,
  getProjectConfig,
};
