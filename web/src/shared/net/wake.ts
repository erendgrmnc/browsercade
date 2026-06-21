/**
 * Free-tier wake-up helpers shared by every online game. The multiplayer server
 * may be asleep (e.g. Render's free tier), so before opening a WebSocket we poll
 * its /health endpoint until it answers — this both wakes it and confirms it's
 * reachable.
 */

/** Derive the HTTP health URL from the WebSocket URL (ws→http, /ws→/health). */
export function healthUrl(wsUrl: string): string {
  return wsUrl.replace(/^ws/, "http").replace(/\/ws\/?$/, "/health");
}

/** Poll /health until it answers OK (waking a sleeping free-tier server), or time out. */
export async function wakeServer(url: string, timeoutMs = 75_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) return true;
    } catch {
      /* still asleep or unreachable — retry */
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  return false;
}
