import axios from "axios";
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

// Poll until user logs in
let retries = 0;
const maxRetries = 60;
const interval = 1000;

const pollForLogin = async ({ configFile, configDir }) => {
  retries++;
  try {
    const res = await axios.get("http://localhost:3001/auth/me");
    const githubUser = res.data;

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir);
    }

    fs.writeFileSync(configFile, JSON.stringify(githubUser, null, 2));
    console.log(`✅ Logged in as ${githubUser.login}`);
  } catch (e) {
    console.log({ retries, maxRetries });
    if (retries <= maxRetries) {
      setTimeout(() => {
        pollForLogin({ configFile, configDir });
      }, interval);
    } else {
      console.error("❌ Login timed out. Please try again.");
    }
  }
};

export { getExistingUser, pollForLogin };
