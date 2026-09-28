// Appels asynchrones en nombre limité (scripts du build, jamais le
// navigateur). Fonction pure, testée par scripts/lib/concurrency.test.mjs.

/**
 * `fn(item, index)` sur chaque élément de `items`, au plus `limit` appels en
 * cours à la fois, lancés dans l'ordre de la liste ; résultats dans l'ordre
 * de `items`, quel que soit l'ordre de fin. Rejette au premier échec : les
 * appels déjà partis vont à leur terme, aucun nouveau ne part. `limit` :
 * entier supérieur ou égal à 1 (RangeError sinon).
 */
export function mapWithConcurrency(items, limit, fn) {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError(`mapWithConcurrency : limite ${limit}, un entier supérieur ou égal à 1 est attendu`);
  }
  const results = new Array(items.length);
  let next = 0;
  let failed = false;
  const worker = async () => {
    while (!failed && next < items.length) {
      const index = next++;
      try {
        results[index] = await fn(items[index], index);
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  };
  return Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker)).then(() => results);
}
