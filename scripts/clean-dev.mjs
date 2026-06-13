import { rmSync } from "node:fs";
import { execSync } from "node:child_process";

rmSync("apps/web/.next", { recursive: true, force: true });
console.log("Cleared apps/web/.next");

if (process.platform === "win32") {
  try {
    execSync(
      'powershell -NoProfile -Command "3000,3002 | ForEach-Object { Get-NetTCPConnection -LocalPort $_ -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } }"',
      { stdio: "inherit" }
    );
    console.log("Freed ports 3000 and 3002");
  } catch {
    // ports may already be free
  }
}
