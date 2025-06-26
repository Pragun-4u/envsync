// cli/commands/initCommand.js
import chalk from "chalk";
import fg from "fast-glob";
import fs from "fs";
import inquirer from "inquirer";
import path from "path";
import { config } from "../../config/config.js";
import { getGitRemoteUrl } from "../../utils/index.js";
import { checkExistingProject, createProjectInCloud } from "./api/index.js";

const INIT_CONFIG_NAME = config.INIT_CONFIG_NAME;

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

const writeConfig = (configPath, configData) => {
  fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));

  const gitignorePath = path.join(process.cwd(), ".gitignore");
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, "utf-8");
    if (!gitignoreContent.includes(INIT_CONFIG_NAME)) {
      fs.appendFileSync(gitignorePath, `\n${INIT_CONFIG_NAME}\n`);
    }
  } else {
    fs.writeFileSync(gitignorePath, `${INIT_CONFIG_NAME}\n`);
  }
};

const init = async () => {
  const cwd = process.cwd();
  const configPath = path.join(cwd, INIT_CONFIG_NAME);

  let configExists = fs.existsSync(configPath);

  if (configExists) {
    const { reInit } = await inquirer.prompt([
      {
        name: "reInit",
        type: "confirm",
        message: "⚙️ Project already initialized. Do you want to re-init?",
        default: false,
      },
    ]);

    if (!reInit) {
      console.log(chalk.yellow("❌ Init cancelled."));
      return;
    }
  } else {
    console.log(
      chalk.yellow("⚙️ No local config found. Attempting recovery...")
    );
    const gitUrl = getGitRemoteUrl();

    if (gitUrl) {
      console.log(
        chalk.blue("🔍 Git remote detected. Attempting to auto-link...")
      );

      const existingProject = await checkExistingProject(gitUrl);

      if (existingProject) {
        console.log(chalk.green("✅ Project found in the cloud."));
        console.log(`Project: ${existingProject.projectName}`);

        const { reLink } = await inquirer.prompt([
          {
            name: "reLink",
            type: "confirm",
            message: "Do you want to re-link this project?",
            default: true,
          },
        ]);

        if (reLink) {
          writeConfig(configPath, {
            projectId: existingProject.projectId,
            gitRemoteUrl: gitUrl,
            defaultProject: existingProject.projectName,
            defaultProfile: existingProject.defaultProfile,
            projects: existingProject.projects,
          });

          console.log(chalk.green("\n✅ Project re-linked successfully!"));
          return;
        }
      }
    }

    console.log(
      chalk.yellow(
        "\n⚙️ No existing project found. Proceeding with fresh init."
      )
    );
  }

  // Step 2: Scan for env files
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

  const gitUrl = getGitRemoteUrl();
  const cloudProject = await createProjectInCloud(projectName, gitUrl);

  if (!cloudProject) return;

  const finalConfig = {
    projectId: cloudProject.projectId,
    gitRemoteUrl: gitUrl,
    defaultProject: projectName,
    defaultProfile,
    projects: {
      [projectName]: profiles,
    },
  };

  writeConfig(configPath, finalConfig);

  console.log(
    chalk.green(
      `\n✅ Project initialized successfully with ${INIT_CONFIG_NAME}!`
    )
  );
  console.log(
    chalk.gray("You can now sync or pull environments using your aliases.\n")
  );

  console.log(chalk.yellow(`🔐 Project Token: ${cloudProject.projectToken}`));
  console.log(
    chalk.gray(
      "Save this token in a safe place in case you need to recover your project without Git.\n"
    )
  );
};

export const initCommand = (program) => {
  program
    .command("init")
    .description("Initialize envsync in the current directory")
    .action(init);
};
