#!/usr/bin/env node

import { program } from "commander";
import {
  loginCommand,
  logoutCommand,
  whoamiCommand,
  initCommand,
  pushCommand,
  pullCommand,
} from "./commands/index.js";
program
  .name("envsync")
  .description("CLI to sync .env files by Pragun")
  .version("0.1.0");

// Register commands
loginCommand(program);
logoutCommand(program);
whoamiCommand(program);
initCommand(program);
pushCommand(program);
pullCommand(program);

program.parse(process.argv);
