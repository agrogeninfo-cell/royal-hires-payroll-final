import { SecureStorage } from '@aparajita/capacitor-secure-storage';

const CONFIG_KEY = 'royal-pay-personal-pin-v1';
const ATTEMPTS_KEY = 'royal-pay-pin-attempts-v1';
const ITERATIONS = 150_000;

export interface PinConfig {
  version: 1;
  salt: string;
  verifier: string;
}

export interface PinThrottle {
  failures: number;
  lockedUntil: number;
}

const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

const hexToBytes = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
};

async function deriveVerifier(pin: string, salt: Uint8Array): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Secure PIN verification is unavailable on this device. Please update Android System WebView and try again.');
  }
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256,
  );
  return bytesToHex(new Uint8Array(derived));
}

function equalHex(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let i = 0; i < left.length; i += 1) {
    difference |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return difference === 0;
}

export async function getPinConfig(): Promise<PinConfig | null> {
  const stored = await SecureStorage.getItem(CONFIG_KEY);
  if (!stored) return null;
  const parsed = JSON.parse(stored) as Partial<PinConfig>;
  if (parsed.version !== 1 || typeof parsed.salt !== 'string' || typeof parsed.verifier !== 'string') {
    throw new Error('The saved PIN settings could not be read safely. Please contact support before clearing app data.');
  }
  return parsed as PinConfig;
}

export async function createPin(pin: string): Promise<void> {
  if (!/^\d{4,8}$/.test(pin)) throw new Error('Choose a PIN with 4 to 8 digits.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const config: PinConfig = {
    version: 1,
    salt: bytesToHex(salt),
    verifier: await deriveVerifier(pin, salt),
  };
  await SecureStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  await SecureStorage.setItem(ATTEMPTS_KEY, JSON.stringify({ failures: 0, lockedUntil: 0 } satisfies PinThrottle));
}

async function getThrottle(): Promise<PinThrottle> {
  const stored = await SecureStorage.getItem(ATTEMPTS_KEY);
  if (!stored) return { failures: 0, lockedUntil: 0 };
  try {
    const value = JSON.parse(stored) as Partial<PinThrottle>;
    return {
      failures: Number.isFinite(value.failures) ? Math.max(0, Number(value.failures)) : 0,
      lockedUntil: Number.isFinite(value.lockedUntil) ? Math.max(0, Number(value.lockedUntil)) : 0,
    };
  } catch {
    return { failures: 0, lockedUntil: 0 };
  }
}

export async function getPinLockRemainingMs(): Promise<number> {
  const throttle = await getThrottle();
  return Math.max(0, throttle.lockedUntil - Date.now());
}

export async function verifyPin(pin: string): Promise<boolean> {
  if (!/^\d{4,8}$/.test(pin)) return false;
  const config = await getPinConfig();
  if (!config) throw new Error('A personal PIN has not been configured.');
  const throttle = await getThrottle();
  if (throttle.lockedUntil > Date.now()) {
    throw new Error(`Too many attempts. Try again in ${Math.ceil((throttle.lockedUntil - Date.now()) / 1000)} seconds.`);
  }

  const actual = await deriveVerifier(pin, hexToBytes(config.salt));
  if (equalHex(actual, config.verifier)) {
    await SecureStorage.setItem(ATTEMPTS_KEY, JSON.stringify({ failures: 0, lockedUntil: 0 } satisfies PinThrottle));
    return true;
  }

  const failures = throttle.failures + 1;
  const lockedUntil = failures >= 5 ? Date.now() + 60_000 : 0;
  await SecureStorage.setItem(ATTEMPTS_KEY, JSON.stringify({ failures: lockedUntil ? 0 : failures, lockedUntil } satisfies PinThrottle));
  if (lockedUntil) throw new Error('Too many incorrect PIN attempts. Try again in 60 seconds.');
  return false;
}


/** Clear only PIN metadata after the user signs out; payroll records remain untouched. */
export async function clearPersonalPin(): Promise<void> {
  await SecureStorage.removeItem(CONFIG_KEY);
  await SecureStorage.removeItem(ATTEMPTS_KEY);
}
