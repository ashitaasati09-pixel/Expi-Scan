/**
 * localStorage-backed "database" that mirrors MongoDB collection semantics.
 * Each collection is stored as a JSON array under a namespaced key.
 * All operations are synchronous (localStorage API).
 */

const PREFIX = "expiscan_";

function key(collection: string): string {
  return PREFIX + collection;
}

function readAll<T>(collection: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key(collection)) || "[]") as T[];
  } catch {
    return [];
  }
}

function writeAll<T>(collection: string, docs: T[]): void {
  localStorage.setItem(key(collection), JSON.stringify(docs));
}

// ── Generic CRUD ──────────────────────────────────────────────────────────────

export const db = {
  /** Insert one document; returns it */
  insertOne<T extends { _id: string }>(collection: string, doc: T): T {
    const docs = readAll<T>(collection);
    docs.push(doc);
    writeAll(collection, docs);
    return doc;
  },

  /** Return all documents matching predicate */
  find<T>(collection: string, predicate?: (doc: T) => boolean): T[] {
    const docs = readAll<T>(collection);
    return predicate ? docs.filter(predicate) : docs;
  },

  /** Return first document matching predicate */
  findOne<T>(collection: string, predicate: (doc: T) => boolean): T | null {
    return readAll<T>(collection).find(predicate) ?? null;
  },

  /** Update first matching document with partial data; returns updated doc or null */
  updateOne<T extends { _id: string }>(
    collection: string,
    predicate: (doc: T) => boolean,
    patch: Partial<T>
  ): T | null {
    const docs = readAll<T>(collection);
    const idx = docs.findIndex(predicate);
    if (idx === -1) return null;
    docs[idx] = { ...docs[idx], ...patch };
    writeAll(collection, docs);
    return docs[idx];
  },

  /** Delete first matching document; returns true if found */
  deleteOne<T>(collection: string, predicate: (doc: T) => boolean): boolean {
    const docs = readAll<T>(collection);
    const idx = docs.findIndex(predicate);
    if (idx === -1) return false;
    docs.splice(idx, 1);
    writeAll(collection, docs);
    return true;
  },

  /** Delete all matching documents */
  deleteMany<T>(collection: string, predicate: (doc: T) => boolean): number {
    const docs = readAll<T>(collection);
    const kept = docs.filter(d => !predicate(d));
    writeAll(collection, kept);
    return docs.length - kept.length;
  },

  /** Drop entire collection */
  drop(collection: string): void {
    localStorage.removeItem(key(collection));
  },
};

// ── Session store ─────────────────────────────────────────────────────────────

const SESSION_KEY = PREFIX + "session";

export const sessionStore = {
  get(): { userId: string; token: string } | null {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch {
      return null;
    }
  },
  set(userId: string, token: string): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId, token }));
  },
  clear(): void {
    localStorage.removeItem(SESSION_KEY);
  },
};
