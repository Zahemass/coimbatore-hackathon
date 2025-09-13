// filename: utils/promptUser.js
import inquirer from "inquirer";

export async function askPort() {
  const { port } = await inquirer.prompt([
    {
      type: "input",
      name: "port",
      message: "Enter the port number where API is running:",
      default: 3000,
    },
  ]);
  return port;
}

export async function askTestCases() {
  const { num } = await inquirer.prompt([
    {
      type: "input",
      name: "num",
      message: "How many test cases to generate (1-7)?",
      default: 2,
      validate: (val) => {
        const n = parseInt(val, 10);
        return n >= 1 && n <= 7 ? true : "Please enter a number between 1 and 7";
      },
    },
  ]);
  return parseInt(num, 10);
}
