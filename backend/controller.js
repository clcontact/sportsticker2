import fetch from "node-fetch";
import CDP from 'chrome-remote-interface';
import { changeKioskUrl } from "./kioskController.js";


// Helper to get the active tab for a Chrome instance
async function getActiveTab(port) {
  const res = await fetch(`http://localhost:${port}/json`);
  const tabs = await res.json();
  // Usually the first tab is the active one
  return tabs[0];
}

// Change URL on a given Chrome instance
export async function changeDisplay(req, res) {
  const { screen, url } = req.body;
  try {
    console.log(`Starting screen change.`);

    const ip = "localhost"; // or your Pi’s IP if remote

    if (screen === "left") {
      await changeKioskUrl(url, ip, 9222);
      console.log(`✅ Left display set to ${url}`);
    } else if (screen === "right") {
      await changeKioskUrl(url, ip, 9223);
      console.log(`✅ Right display set to ${url}`);
    } else {
      return res.status(400).json({ error: "Invalid screen" });
    }

    res.json({ success: true });
  } catch (err) {
    console.warn(`⚠️ Something went wrong changing ${screen} -> ${url}`, err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getDisplayInfo(port) {
  try {
    // Get list of open targets (tabs)
    const targets = await CDP.List({ host: "localhost", port });

    // Find the active "page" tab
    const activeTab = targets.find(t => t.type === "page");
    const url = activeTab ? activeTab.url : null;

    return { url };
  } catch (err) {
    console.error(`❌ Could not get display info from ${port}: ${err.message}`);
    return { url: null };
  }
}