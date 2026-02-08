import * as webpush from "jsr:@negrel/webpush";
import { decodeBase64Url } from "jsr:@std/encoding@0.224.3/base64url";

export interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushResult {
  success: boolean;
  stale: boolean;
  error?: string;
}

let appServer: webpush.ApplicationServer | null = null;

/**
 * Convert raw base64url-encoded VAPID keys to JWK format for P-256 ECDSA.
 */
function rawKeysToJwk(publicKeyB64: string, privateKeyB64: string): { publicKey: JsonWebKey; privateKey: JsonWebKey } {
  const pubBytes = decodeBase64Url(publicKeyB64);
  // Public key is 65 bytes: 0x04 || x (32 bytes) || y (32 bytes)
  const x = pubBytes.slice(1, 33);
  const y = pubBytes.slice(33, 65);

  const privBytes = decodeBase64Url(privateKeyB64);

  // base64url encode without padding
  const b64url = (buf: Uint8Array) => {
    let str = "";
    for (const b of buf) str += String.fromCharCode(b);
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };

  return {
    publicKey: {
      kty: "EC",
      crv: "P-256",
      x: b64url(x),
      y: b64url(y),
      ext: true,
    },
    privateKey: {
      kty: "EC",
      crv: "P-256",
      x: b64url(x),
      y: b64url(y),
      d: b64url(privBytes),
      ext: true,
    },
  };
}

export async function initVapidKeys(publicKey: string, privateKey: string): Promise<void> {
  if (appServer) return;

  const jwk = rawKeysToJwk(publicKey, privateKey);
  const vapidKeys = await webpush.importVapidKeys(jwk);
  appServer = new webpush.ApplicationServer(vapidKeys, "mailto:notifications@everydriver.com");
}

export async function sendPush(
  sub: PushSubscriptionData,
  payload: Record<string, unknown>
): Promise<PushResult> {
  if (!appServer) {
    return { success: false, stale: false, error: "VAPID keys not initialized" };
  }

  try {
    const subscriber = appServer.subscribe({
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    });

    await subscriber.pushTextMessage(JSON.stringify(payload), {});
    return { success: true, stale: false };
  } catch (error) {
    const errMsg = (error as Error).message || String(error);

    if (
      error instanceof webpush.PushMessageError &&
      (error.statusCode === 404 || error.statusCode === 410)
    ) {
      console.log(`Stale subscription (${error.statusCode}): ${sub.endpoint}`);
      return { success: false, stale: true, error: errMsg };
    }

    console.error("Push delivery error:", errMsg);
    return { success: false, stale: false, error: errMsg };
  }
}
