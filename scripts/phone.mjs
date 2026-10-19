// Teste no telemóvel, em casa: abre o app e o servidor de leitura de prints na tua rede Wi-Fi.
//   npm run phone      (PC e telemóvel na mesma rede; Ctrl+C para parar)
// A chave da Anthropic continua só no PC (ficheiro .env). Só quem estiver na tua rede consegue usar.
import { spawn } from "node:child_process";
import { networkInterfaces } from "node:os";

const ips = Object.values(networkInterfaces())
  .flat()
  .filter((i) => i && i.family === "IPv4" && !i.internal)
  .map((i) => i.address)
  .sort((a, b) => Number(/^(192\.168|10\.)/.test(b)) - Number(/^(192\.168|10\.)/.test(a)));

const run = (args, env = {}) => spawn(process.platform === "win32" ? "npx.cmd" : "npx", args, { stdio: "inherit", shell: process.platform === "win32", env: { ...process.env, ...env } });
const procs = [run(["tsx", "server/capture.ts"], { CAPTURE_LAN: "1" }), run(["vite", "--host", "0.0.0.0", "--port", "5174"])];

setTimeout(() => {
  console.log("\n=== No telemóvel (mesmo Wi-Fi), abre: ===");
  for (const ip of ips) console.log(`    http://${ip}:5174`);
  console.log("Se o Windows perguntar pela firewall, escolhe 'Redes privadas' e permite.\nCtrl+C aqui para parar.\n");
}, 4000);

const stop = () => { procs.forEach((p) => p.kill()); process.exit(0); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
