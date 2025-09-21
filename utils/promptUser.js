// filename: utils/promptUser.js
import inquirer from "inquirer";

export async function askPort() {
  const { port } = await inquirer.prompt([
    {
      type: "input",
      name: "port",
      message: "Enter the port number where API is running:",