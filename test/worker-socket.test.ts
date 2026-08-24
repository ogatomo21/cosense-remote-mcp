import { afterEach, describe, expect, it, vi } from "vitest";

import { CookieWebSocket } from "../src/cosense/worker-socket";

describe("CookieWebSocket", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("upgrades through fetch with the Cosense session cookie", async () => {
    const upstream = {
      accept: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn(),
      binaryType: "blob",
    } as unknown as WebSocket;
    const fetchMock = vi.fn().mockResolvedValue({ webSocket: upstream });
    vi.stubGlobal("fetch", fetchMock);
    const onopen = vi.fn();

    const socket = new CookieWebSocket("wss://scrapbox.io/socket.io/?EIO=4&transport=websocket", {
      Cookie: "connect.sid=session-value",
      Referer: "https://scrapbox.io/",
    });
    socket.onopen = onopen;

    await vi.waitFor(() => expect(onopen).toHaveBeenCalledOnce());

    expect(fetchMock).toHaveBeenCalledWith(
      "https://scrapbox.io/socket.io/?EIO=4&transport=websocket",
      {
        headers: {
          Upgrade: "websocket",
          Cookie: "connect.sid=session-value",
          Referer: "https://scrapbox.io/",
        },
        redirect: "manual",
      },
    );
    expect(upstream.accept).toHaveBeenCalledOnce();
    expect(upstream.binaryType).toBe("arraybuffer");
  });
});
