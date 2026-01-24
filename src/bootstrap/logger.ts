import chalk from "chalk";

export const logger = {
  info: (msg: string, meta?: unknown) => {
    console.log(
      `${chalk.blue.bold("[ INFO ]")} ${chalk.blue(msg)}`,
      meta ? chalk.cyan(JSON.stringify(meta, null, 2)) : ""
    );
  },

  warn: (msg: string, meta?: unknown) => {
    console.warn(
      `${chalk.yellow.bold("[ WARN ]")} ${chalk.yellow(msg)}`,
      meta ? chalk.yellow(JSON.stringify(meta, null, 2)) : ""
    );
  },

  error: (msg: string, meta?: unknown) => {
    console.error(
      `${chalk.red.bold("[ ERROR ]")} ${chalk.red(msg)}`,
      meta ? chalk.red(JSON.stringify(meta, null, 2)) : ""
    );
  },

  success: (msg: string, meta?: unknown) => {
    console.log(
      `${chalk.green.bold("[ OK ]")} ${chalk.green(msg)}`,
      meta ? chalk.green(JSON.stringify(meta, null, 2)) : ""
    );
  },

  debug: (msg: string, meta?: unknown) => {
    console.log(
      `${chalk.magenta.bold("[DEBUG]")} ${chalk.magenta(msg)}`,
      meta ? chalk.magenta(JSON.stringify(meta, null, 2)) : ""
    );
  },
};
