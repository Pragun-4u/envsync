import chalk from "chalk";
import authService from "../services/authService.js";
import configService from "../services/configService.js";

export const logoutCommand = (program) => {
  program
    .command("logout")
    .description("Logout from your account")
    .action(async () => {
      try {
        const existingUser = configService.getUser();

        if (!existingUser) {
          console.log(chalk.yellow("👤 Not logged in"));
          return;
        }

        // Call the logout API first
        const res = await authService.logout();

        if (!res) {
          console.error(chalk.red("❌ Logout failed"));
          return;
        }

        // Then delete local config
        configService.deleteUser();

        console.log(
          chalk.green(
            `✅ Successfully logged out as ${chalk.bold(existingUser.login)}`
          )
        );
      } catch (error) {
        console.error(chalk.red("❌ Logout error:"), error.message);
        process.exit(1);
      }
    });
};
