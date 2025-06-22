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

export { getExistingUser };
