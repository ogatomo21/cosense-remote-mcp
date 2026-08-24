import { WebSocket as EngineIoWebSocket } from "engine.io-client";
import { io, type Socket } from "socket.io-client";

const COSENSE_ORIGIN = "https://scrapbox.io";

type WebSocketHeaders = Readonly<Record<"Cookie" | "Referer", string>>;

/**
 * Engine.IO's browser transport cannot attach `extraHeaders` to a WebSocket.
 * Workers can perform the WebSocket Upgrade with fetch(), which does preserve
 * the Cookie header, so this adapter exposes the upgraded socket through the
 * small browser-WebSocket surface Engine.IO uses.
 */
export class CookieWebSocket {
  private socket: WebSocket | undefined;
  private closed = false;
  private currentBinaryType: BinaryType = "arraybuffer";

  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(uri: string, headers: WebSocketHeaders) {
    void this.connect(uri, headers);
  }

  get binaryType(): BinaryType {
    return this.currentBinaryType;
  }

  set binaryType(value: BinaryType) {
    this.currentBinaryType = value;
    if (this.socket) this.socket.binaryType = value;
  }

  send(data: string | ArrayBuffer | ArrayBufferView | Blob): void {
    if (!this.socket) throw new Error("WebSocket is not open.");
    this.socket.send(data);
  }

  close(): void {
    this.closed = true;
    this.socket?.close();
  }

  private async connect(uri: string, headers: WebSocketHeaders): Promise<void> {
    try {
      const upgradeUrl = new URL(uri);
      upgradeUrl.protocol = upgradeUrl.protocol === "wss:" ? "https:" : "http:";
      const response = await fetch(upgradeUrl.toString(), {
        headers: {
          Upgrade: "websocket",
          ...headers,
        },
        // Do not forward the Cosense session cookie if an unexpected redirect occurs.
        redirect: "manual",
      });
      const socket = response.webSocket;
      if (!socket) throw new Error("Cosense did not accept the WebSocket upgrade.");
      if (this.closed) {
        socket.close();
        return;
      }

      this.socket = socket;
      socket.accept();
      socket.binaryType = this.currentBinaryType;
      socket.addEventListener("message", (event) => this.onmessage?.(event));
      socket.addEventListener("close", (event) => this.onclose?.(event));
      socket.addEventListener("error", (event) => this.onerror?.(event));
      // A socket obtained from fetch() is ready once accept() returns, while
      // Engine.IO waits for the browser-style open callback.
      this.onopen?.(new Event("open"));
    } catch (error) {
      this.onerror?.({ type: "error", error } as unknown as Event);
    }
  }
}

export class WorkerCookieWebSocketTransport extends EngineIoWebSocket {
  override createSocket(uri: string): CookieWebSocket {
    const headers = this.opts.extraHeaders as Partial<WebSocketHeaders> | undefined;
    if (!headers?.Cookie) throw new Error("Cosense session cookie is not configured.");
    return new CookieWebSocket(uri, {
      Cookie: headers.Cookie,
      Referer: headers.Referer ?? `${COSENSE_ORIGIN}/`,
    });
  }
}

export function createCosenseSocket(sid: string): Socket {
  return io(COSENSE_ORIGIN, {
    autoConnect: false,
    reconnectionDelay: 5_000,
    transports: [WorkerCookieWebSocketTransport],
    extraHeaders: {
      Cookie: `connect.sid=${sid}`,
      Referer: `${COSENSE_ORIGIN}/`,
    },
  });
}
