import chalk from "chalk";
import configService from "../services/configService.js";

export const whoamiCommand = (program) => {
  program
    .command("whoami")
    .description("Show currently logged in user")
    .action(() => {
      const user = configService.getUser();
      if (user) {
        console.log(chalk.blue(`👤 Logged in as ${chalk.bold(user.login)}`));

        if (user.name) {
          console.log(chalk.gray(`🖊️ Name:  ${user.name}`));
        }
        if (user.email) {
          console.log(chalk.gray(`📧 Email: ${user.email}`));
        }

        if (user.created_at) {
          const joinDate = new Date(user.created_at).toLocaleDateString();
          console.log(chalk.gray(`📅 GitHub member since: ${joinDate}`));
        }
      } else {
        console.log(chalk.yellow("👤 Not logged in"));
        console.log(chalk.gray("Run 'envsync login' to authenticate"));
      }
    });
};
