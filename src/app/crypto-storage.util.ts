// Crypto Storage Utility for Secure API Key Persistence
// Uses Web Crypto API (AES-GCM 256-bit) with un-extractable CryptoKey in IndexedDB

const DB_NAME = 'secure_key_db';
const STORE_NAME = 'keys';
const MASTER_KEY_ID = 'openrouter_master_key';

const ENCRYPTED_KEY_STORAGE = 'sila_pdf_encrypted_api_key';
const IV_KEY_STORAGE = 'sila_pdf_api_key_iv';
const LEGACY_STORAGE_KEYS = ['sila_pdf_translator_user_api_key', 'openrouter_api_key'];

function openKeyDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB is not supported in this environment.'));
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storeCryptoKey(key: CryptoKey): Promise<void> {
  const db = await openKeyDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(key, MASTER_KEY_ID);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function getStoredCryptoKey(): Promise<CryptoKey | null> {
  try {
    const db = await openKeyDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(MASTER_KEY_ID);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function deleteStoredCryptoKey(): Promise<void> {
  try {
    const db = await openKeyDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(MASTER_KEY_ID);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore error if database does not exist
  }
}

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function generateKey(): Promise<CryptoKey> {
  return window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    false, // extractable: false for maximum security
    ['encrypt', 'decrypt']
  );
}

export function hasSecureApiKey(): boolean {
  if (typeof localStorage === 'undefined') return false;
  const encrypted = localStorage.getItem(ENCRYPTED_KEY_STORAGE);
  const iv = localStorage.getItem(IV_KEY_STORAGE);
  if (encrypted && iv) return true;

  for (const legacyKey of LEGACY_STORAGE_KEYS) {
    if (localStorage.getItem(legacyKey)) return true;
  }
  return false;
}

export async function saveSecureApiKey(rawKey: string): Promise<boolean> {
  if (!rawKey || rawKey.trim() === '') {
    await removeSecureApiKey();
    return true;
  }

  try {
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
      localStorage.setItem('sila_pdf_translator_user_api_key', rawKey.trim());
      return true;
    }

    let cryptoKey = await getStoredCryptoKey();
    if (!cryptoKey) {
      cryptoKey = await generateKey();
      await storeCryptoKey(cryptoKey);
    }

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(rawKey.trim());

    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource,
      },
      cryptoKey,
      encodedData as BufferSource
    );

    localStorage.setItem(ENCRYPTED_KEY_STORAGE, bufferToBase64(ciphertext));
    localStorage.setItem(IV_KEY_STORAGE, bufferToBase64(iv));

    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      localStorage.removeItem(legacyKey);
    }

    return true;
  } catch (err) {
    console.error('Lỗi khi mã hóa và lưu API Key:', err);
    return false;
  }
}

export async function getSecureApiKey(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const encryptedBase64 = localStorage.getItem(ENCRYPTED_KEY_STORAGE);
  const ivBase64 = localStorage.getItem(IV_KEY_STORAGE);

  if (encryptedBase64 && ivBase64) {
    try {
      const cryptoKey = await getStoredCryptoKey();
      if (!cryptoKey) {
        return null;
      }

      const ciphertext = base64ToBuffer(encryptedBase64);
      const iv = base64ToBuffer(ivBase64);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv as BufferSource,
        },
        cryptoKey,
        ciphertext as BufferSource
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (err) {
      console.error('Lỗi khi giải mã API Key từ bộ nhớ mã hóa:', err);
      return null;
    }
  }

  // Fallback and auto-migration for legacy plaintext keys
  for (const legacyKeyName of LEGACY_STORAGE_KEYS) {
    const legacyValue = localStorage.getItem(legacyKeyName);
    if (legacyValue && legacyValue.trim() !== '') {
      const cleanVal = legacyValue.trim();
      await saveSecureApiKey(cleanVal);
      return cleanVal;
    }
  }

  return null;
}

export async function removeSecureApiKey(): Promise<void> {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(ENCRYPTED_KEY_STORAGE);
    localStorage.removeItem(IV_KEY_STORAGE);
    for (const legacyKeyName of LEGACY_STORAGE_KEYS) {
      localStorage.removeItem(legacyKeyName);
    }
  }
  await deleteStoredCryptoKey();
}
