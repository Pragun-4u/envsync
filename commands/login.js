import open from "open";
import ora from "ora";
import chalk from "chalk";
import authService from "../services/authService.js";
import configService from "../services/configService.js";

export const loginCommand = (program) => {
  program
    .command("login")
    .description("Login using your GitHub Account")
    .action(async () => {
      try {
        // Check if already logged in
        const existingUser = configService.getUser();
        if (existingUser) {
          console.log(
            chalk.blue(
              `👤 Already logged in as ${chalk.bold(existingUser.login)}`
            )
          );
          return;
        }

        // Open browser for login
        console.log(chalk.yellow("🔓 Opening browser for GitHub login..."));
        const loginUrl = authService.getLoginUrl();
        await open(loginUrl);

        // Start polling with spinner
        const spinner = ora("Waiting for login...").start();

        await authService.pollForLogin(
          (user) => {
            console.log({ user });
            spinner.succeed(
              chalk.green(
                `✅ Successfully logged in as ${chalk.bold(user.name)}`
              )
            );
            console.log(chalk.gray(`✍️ Name: ${user.name || "Not specified"}`));
            console.log(
              chalk.gray(`\n📧 Email: ${user.email || "Not available"}`)
            );
            console.log(
              chalk.gray(`📍 Location: ${user.location || "Not specified"}`)
            );
          },
          (error) => {
            spinner.fail(chalk.red("❌ Login failed"));
            console.error(chalk.red(error.message));
            process.exit(1);
          }
        );
      } catch (error) {
        console.error(
          chalk.red("❌ An unexpected error occurred:"),
          error.message
        );
        process.exit(1);
      }
    });
};
