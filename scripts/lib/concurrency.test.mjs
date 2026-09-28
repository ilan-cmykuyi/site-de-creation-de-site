import { describe, expect, it } from "vitest";
import { mapWithConcurrency } from "./concurrency.mjs";

function deferred() {
  let resolve;
  const promise = new Promise((onResolve) => {
    resolve = onResolve;
  });
  return { promise, resolve };
}

/** Laisse passer les micro-tâches en attente (appels qui démarrent après une fin). */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("mapWithConcurrency", () => {
  it("résultats dans l'ordre des éléments, quel que soit l'ordre de fin", async () => {
    const pending = [0, 1, 2, 3, 4, 5].map(() => deferred());
    const running = mapWithConcurrency([0, 1, 2, 3, 4, 5], 6, (item) => pending[item].promise.then(() => `r${item}`));
    for (const { resolve } of [...pending].reverse()) resolve();
    expect(await running).toStrictEqual(["r0", "r1", "r2", "r3", "r4", "r5"]);
  });

  it("au plus `limit` appels en cours à la fois, chaque élément une fois, avec son indice", async () => {
    const pending = new Map();
    const started = [];
    let active = 0;
    let maxActive = 0;
    const running = mapWithConcurrency(["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"], 4, async (item, index) => {
      started.push([item, index]);
      active++;
      maxActive = Math.max(maxActive, active);
      const gate = deferred();
      pending.set(item, gate);
      await gate.promise;
      active--;
      return item.toUpperCase();
    });
    await settle();
    expect(started.map(([item]) => item)).toStrictEqual(["a", "b", "c", "d"]);
    // Fin de « c » d'abord : un seul nouvel appel part, le suivant de la liste.
    pending.get("c").resolve();
    await settle();
    expect(started.map(([item]) => item)).toStrictEqual(["a", "b", "c", "d", "e"]);
    // Le reste : chaque fin libère une place, jusqu'au dernier élément.
    let done = false;
    running.then(() => {
      done = true;
    });
    while (!done) {
      for (const gate of pending.values()) gate.resolve();
      await settle();
    }
    expect(await running).toStrictEqual(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]);
    expect(maxActive).toBe(4);
    expect(started).toStrictEqual([..."abcdefghij"].map((item, index) => [item, index]));
  });

  it("moins d'éléments que la limite, ou aucun", async () => {
    expect(await mapWithConcurrency([1, 2], 4, async (n) => n * 10)).toStrictEqual([10, 20]);
    expect(await mapWithConcurrency([], 4, async () => "jamais")).toStrictEqual([]);
  });

  it("un échec rejette, et plus aucun appel ne part", async () => {
    const started = [];
    const error = new Error("HTTP 500");
    const running = mapWithConcurrency([1, 2, 3, 4], 1, async (n) => {
      started.push(n);
      if (n === 2) throw error;
      return n;
    });
    await expect(running).rejects.toBe(error);
    expect(started).toStrictEqual([1, 2]);
  });

  it("limite qui n'est pas un entier positif : refusée", () => {
    for (const limit of [0, -1, 1.5, Number.NaN]) {
      expect(() => mapWithConcurrency([1], limit, async (n) => n)).toThrow(RangeError);
    }
  });
});
