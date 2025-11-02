import CDP from 'chrome-remote-interface';

/**
 * Connects to the remote Chromium instance via CDP and navigates to the new URL.
 *
 * @param {string} newUrl The URL to navigate to.
 * @param {string} ip The IP address of the Raspberry Pi.
 * @param {number} port The CDP debugging port (e.g., 9222).
 * @returns {Promise<{success: boolean, message: string}>} Result object.
 */
async function changeKioskUrl(newUrl, ip, port) {
    let client;
    try {
        // Connect to the remote debugging port on the Raspberry Pi
        client = await CDP({ host: ip, port: port });
        const { Page } = client;

        // Enable the Page domain to access navigation methods
        await Page.enable();

        // Navigate to the new URL
        await Page.navigate({ url: newUrl });

        // Wait for navigation to complete (optional, but good practice)
        await Page.loadEventFired();
        
        console.log(`[SUCCESS] Navigated kiosk on ${ip} to: ${newUrl}`);
        return { success: true, message: `Kiosk updated to: ${newUrl}` };

    } catch (err) {
        console.error(`[ERROR] Failed to change URL on ${ip}:${port}:`, err.message);
        return { 
            success: false, 
            message: `ERROR: Could not connect to RPi browser or navigate. Is the browser running on ${ip}:${port}? Error: ${err.message}` 
        };
    } finally {
        if (client) {
            try {
                // Safely close the CDP connection
                client.close();
            } catch (e) {
                // Ignore errors on closing connection
            }
        }
    }
}

export {
    changeKioskUrl
};