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
