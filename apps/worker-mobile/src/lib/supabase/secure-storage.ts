import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 1800;
const PREFIX = 'busho.auth.v1';

type Manifest = { version: 1; generation: string; count: number };

function storagePrefix(key: string) {
  return `${PREFIX}.${encodeURIComponent(key)}`;
}
function manifestKey(key: string) {
  return `${storagePrefix(key)}.manifest`;
}
function chunkKey(key: string, generation: string, index: number) {
  return `${storagePrefix(key)}.${generation}.${index}`;
}

async function readManifest(key: string): Promise<Manifest | null> {
  const raw = await SecureStore.getItemAsync(manifestKey(key));
  if (!raw) return null;
  const parsed = JSON.parse(raw) as Partial<Manifest>;
  if (
    parsed.version !== 1 ||
    typeof parsed.generation !== 'string' ||
    !/^[a-z0-9-]{1,48}$/.test(parsed.generation) ||
    !Number.isInteger(parsed.count) ||
    (parsed.count ?? 0) < 1
  ) {
    throw new Error('Secure session storage manifest is invalid.');
  }
  return { version: 1, generation: parsed.generation, count: parsed.count as number };
}

async function deleteGeneration(key: string, generation: string, count: number) {
  await Promise.all(
    Array.from({ length: count }, (_, index) =>
      SecureStore.deleteItemAsync(chunkKey(key, generation, index)),
    ),
  );
}

export const secureSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    const manifest = await readManifest(key);
    if (!manifest) return null;
    const parts = await Promise.all(
      Array.from({ length: manifest.count }, (_, index) =>
        SecureStore.getItemAsync(chunkKey(key, manifest.generation, index)),
      ),
    );
    if (parts.some((part) => part === null)) {
      throw new Error('Secure session storage is incomplete; refusing to restore a partial session.');
    }
    return decodeURIComponent((parts as string[]).join(''));
  },

  async setItem(key: string, value: string): Promise<void> {
    const encoded = encodeURIComponent(value);
    const count = Math.max(1, Math.ceil(encoded.length / CHUNK_SIZE));
    const previous = await readManifest(key);
    const generation = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

    try {
      await Promise.all(
        Array.from({ length: count }, (_, index) =>
          SecureStore.setItemAsync(
            chunkKey(key, generation, index),
            encoded.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE),
          ),
        ),
      );
      await SecureStore.setItemAsync(
        manifestKey(key),
        JSON.stringify({ version: 1, generation, count } satisfies Manifest),
      );
    } catch (error) {
      await deleteGeneration(key, generation, count);
      throw error;
    }

    if (previous) {
      await deleteGeneration(key, previous.generation, previous.count);
    }
  },

  async removeItem(key: string): Promise<void> {
    const manifest = await readManifest(key);
    await SecureStore.deleteItemAsync(manifestKey(key));
    if (manifest) await deleteGeneration(key, manifest.generation, manifest.count);
  },
};
