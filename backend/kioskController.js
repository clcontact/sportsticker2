import CDP from 'chrome-remote-interface';
import fetch from 'node-fetch';

/**
 * Change the URL of a single-tab Chromium instance via CDP.
 *
 * @param {string} newUrl - The URL to navigate to.
 * @param {string} ip - The host/IP of the Chromium instance (e.g., "localhost").
 * @param {number} port - The remote debugging port (e.g., 9222 or 9223).
 */
async function changeKioskUrl(newUrl, ip, port) {
    let client;

    try {
        // Step 1: Fetch the list of tabs for this port
        const res = await fetch(`http://${ip}:${port}/json`);
        const tabs = await res.json();

        // Step 2: Pick the first tab of type "page"
        const tab = tabs.find(t => t.type === 'page');
        if (!tab) throw new Error(`No page tab found on port ${port}`);

        // Step 3: Connect to that specific tab
        client = await CDP({ target: tab, host: ip, port });

        // Step 4: Enable Page domain and navigate
        const { Page } = client;
        await Page.enable();
        await Page.navigate({ url: newUrl });
        await Page.loadEventFired();

        console.log(`[SUCCESS] Navigated kiosk on ${ip}:${port} to: ${newUrl}`);
        return { success: true, message: `Kiosk updated to: ${newUrl}` };

    } catch (err) {
        console.error(`[ERROR] Failed to change URL on ${ip}:${port}:`, err.message);
        return { 
            success: false, 
            message: `ERROR: Could not connect or navigate. Is Chromium running on ${ip}:${port}? Error: ${err.message}`
        };
    } finally {
        if (client) {
            try { await client.close(); } catch (e) { /* ignore */ }
        }
    }
}

export { changeKioskUrl };
