import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import chalk from "chalk";
import fg from "fast-glob";

const INIT_CONFIG_NAME = ".envsync.json";

const COMMON_DIRS = [".", "apps", "packages"];

const findEnvFiles = async (baseDir) => {
  return await fg(
    [
      "**/.env*",
      "!**/node_modules/**",
      "!**/.git/**",
      "!**/dist/**",
      "!**/build/**",
      "!**/coverage/**",
      `!**/${INIT_CONFIG_NAME}`,
    ],
    {
      cwd: baseDir,
      onlyFiles: true,
    }
  );
};

const init = async () => {
  const cwd = process.cwd();

  // Step 1: Try auto-detecting env files in common directories
  const suggestions = [];
  for (const dir of COMMON_DIRS) {
    const full = path.join(cwd, dir);
    if (fs.existsSync(full)) {
      const found = await findEnvFiles(full);
      if (found.length) {
        suggestions.push({
          name: `${dir}/ (${found.length} env file${
            found.length > 1 ? "s" : ""
          })`,
          value: dir,
        });
      }
    }
  }

  suggestions.push({ name: "🔍 Enter custom path", value: "__custom__" });

  const { selectedPath } = await inquirer.prompt([
    {
      name: "selectedPath",
      type: "list",
      message: "📂 Where should we look for .env files?",
      choices: suggestions,
    },
  ]);

  let scanPath = selectedPath;
  if (selectedPath === "__custom__") {
    const custom = await inquirer.prompt([
      {
        name: "scanPath",
        type: "input",
        message: "✏️ Enter custom folder path:",
        default: ".",
        validate: (input) => {
          const fullPath = path.join(cwd, input);
          return fs.existsSync(fullPath) ? true : "Path does not exist.";
        },
      },
    ]);
    scanPath = custom.scanPath;
  }

  const allEnvFiles = await findEnvFiles(path.join(cwd, scanPath));

  if (allEnvFiles.length === 0) {
    console.log(chalk.red("❌ No .env files found in the specified folder."));
    return;
  }

  const { selectedFiles } = await inquirer.prompt([
    {
      name: "selectedFiles",
      type: "checkbox",
      message: "📝 Select the .env files you'd like to configure:",
      choices: allEnvFiles,
      validate: (input) =>
        input.length > 0 || "You must select at least one file.",
    },
  ]);

  const { projectName } = await inquirer.prompt([
    {
      name: "projectName",
      type: "input",
      message: "📦 What would you like to name this project?",
      validate: (input) =>
        input.trim() !== "" || "Project name cannot be empty.",
    },
  ]);

  const profiles = {};
  for (const file of selectedFiles) {
    const defaultLabel = path.basename(file);

    const { envLabel } = await inquirer.prompt([
      {
        name: "envLabel",
        type: "input",
        message: `🌱 Give a short name for this file (${file}) — like dev, prod, staging:`,
        default: defaultLabel,
        validate: (input) => {
          if (!input.trim()) return "Label cannot be empty.";
          if (profiles[input])
            return "Label already used. Please choose another.";
          return true;
        },
      },
    ]);

    profiles[envLabel] = file;
  }

  if (Object.keys(profiles).length === 0) {
    console.log(chalk.yellow("⚠️ No files selected. Exiting init."));
    return;
  }

  console.log(
    "\nℹ️  The default environment will be used when you run commands without choosing one explicitly.\n"
  );

  const { defaultProfile } = await inquirer.prompt([
    {
      name: "defaultProfile",
      type: "list",
      message: "✅ Which one should be the default environment?",
      choices: Object.keys(profiles),
    },
  ]);

  const config = {
    projects: {
      [projectName]: profiles,
    },
    defaultProject: projectName,
    defaultProfile,
  };

  const configPath = path.join(cwd, INIT_CONFIG_NAME);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  console.log(
    chalk.green(
      `\n✅ Project initialized successfully with ${INIT_CONFIG_NAME}!`
    )
  );
  console.log(
    chalk.gray("You can now sync or pull environments using your aliases.\n")
  );
};

export const initCommand = (program) => {
  program
    .command("init")
    .description("Initialize envsync in the current directory")
    .action(init);
};
