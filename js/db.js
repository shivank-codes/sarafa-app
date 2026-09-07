const DB_NAME = 'sarafa';
const DB_VERSION = 1;
let dbPromise = null;

export function open() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('rates')) {
        db.createObjectStore('rates', { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains('bills')) {
        const s = db.createObjectStore('bills', { keyPath: 'id', autoIncrement: true });
        s.createIndex('byCustomer', 'customerId');
        s.createIndex('byDate', 'date');
      }
      if (!db.objectStoreNames.contains('customers')) {
        const s = db.createObjectStore('customers', { keyPath: 'id', autoIncrement: true });
        s.createIndex('byPhone', 'phone');
      }
      if (!db.objectStoreNames.contains('payments')) {
        const s = db.createObjectStore('payments', { keyPath: 'id', autoIncrement: true });
        s.createIndex('byCustomer', 'customerId');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function wrap(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function put(store, value) {
  const db = await open();
  const tx = db.transaction(store, 'readwrite');
  return wrap(tx.objectStore(store).put(value));
}

export async function all(store) {
  const db = await open();
  return wrap(db.transaction(store, 'readonly').objectStore(store).getAll());
}

export async function get(store, key) {
  const db = await open();
  return wrap(db.transaction(store, 'readonly').objectStore(store).get(key));
}

export async function byIndex(store, index, value) {
  const db = await open();
  return wrap(
    db.transaction(store, 'readonly').objectStore(store).index(index).getAll(value)
  );
}
