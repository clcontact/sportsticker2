// chromeSupervisor.js
import { exec } from "child_process";
import util from "util";
const execPromise = util.promisify(exec);



const BASE_URL2 = process.env.BASE_URL;
const LEFT_PORT = 9222;
const RIGHT_PORT = 9223;

// Check if Chrome debugging port is responding
export async function isChromeRunning(port) {
  try {
    const res = await fetch(`http://localhost:${port}/json`);
    if (!res.ok) throw new Error();
    return true;
  } catch {
    return false;
  }
}

// Start Chrome for a given screen
export async function startChrome(screen) {
    const BASE_URL = process.env.BASE_URL;
    const CHROME_CMD = process.platform === "win32"
    ? process.env.CHROME_WINDOWS
    : process.env.CHROME_LINUX;    
    console.log(`startChrome->${process.platform} screen: ${screen}`);
    console.log(`startChrome->BASE_URL->${BASE_URL}`);
    console.log(`startChrome->process.env.BASE_URL->${process.env.BASE_URL}`);
    
    
  const profileDir = process.platform === "win32"
      ? `C:\\Temp\\${screen}-profile`
      : `/tmp/${screen}-profile`;
console.log(`startChrome->profileDir->${profileDir} `);
  const port = screen === "left" ? LEFT_PORT : RIGHT_PORT;
  console.log(`startChrome->port->${port} `);
  const startUrl = screen === "left" ? `${BASE_URL}/LeagueTracker/nfl/4` : `${BASE_URL}/GameDetailsPage2/nfl/phi`;
console.log(`startChrome->startUrl->${startUrl} `);
  let cmd;
  if (process.platform === "win32") {
    cmd = `"${CHROME_CMD}" --remote-debugging-port=${port} --no-first-run --disable-infobars --disable-session-crashed-bubble --user-data-dir="${profileDir}" --kiosk ${startUrl}`;
  } else {
    //may have to tweek this for PI
    cmd = `${CHROME_CMD} --remote-debugging-port=${port} --user-data-dir=${profileDir} --kiosk ${startUrl} --noerrdialogs --disable-session-crashed-bubble --disable-infobars --start-fullscreen --window-position=${
      screen === "left" ? "0,0" : "1920,0"
    }`;
  }

  console.log(`🚀 Launching ${screen} Chrome: ${cmd}`);

  try {
    await execPromise(cmd);
    return { success: true };
  } catch (err) {
    console.error(`❌ Failed to start Chrome for ${screen}:`, err.message);
    return { success: false, error: err.message };
  }
}

// Restart Chrome
export async function restartChrome(screen) {
  const port = screen === "left" ? LEFT_PORT : RIGHT_PORT;
  await execPromise(`pkill -f "${CHROME_CMD}.*${port}" || true`);
  return await startChrome(screen);
}