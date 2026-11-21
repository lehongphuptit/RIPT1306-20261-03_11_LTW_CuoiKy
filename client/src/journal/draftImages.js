let connection;

async function store(mode, operation) {
  if (!connection) connection = new Promise((resolve, reject) => {
    const request = indexedDB.open('wanderly-draft-images', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('images');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }).catch(error => { connection = undefined; throw error; });
  const db = await connection;
  return new Promise((resolve, reject) => {
    const tx = db.transaction('images', mode);
    const request = operation(tx.objectStore('images'));
    tx.oncomplete = () => resolve(request.result);
    tx.onabort = () => reject(tx.error);
    tx.onerror = () => reject(tx.error);
  });
}
export const readImages = key => store('readonly', table => table.get(key));
export const saveImages = (key, files) => store('readwrite', table => files.length ? table.put(files, key) : table.delete(key));
