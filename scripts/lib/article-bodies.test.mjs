import { readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { extname, join, posix, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";
import { collectArticleBodies, parseArticleBodies } from "./article-bodies.mjs";

/** Résumé d'article, tel que GET /content le renvoie (sans corps). */
function summary(slug) {
  return { slug, title: slug, excerpt: null, cover: null, publishedAt: null, seoTitle: null, seoDescription: null };
}

describe("collectArticleBodies", () => {
  it("range le corps de chaque article, dans l'ordre de la liste", async () => {
    const online = { "fuite-sous-evier": "<p>Coupez l'eau.</p>", "choisir-son-chauffe-eau": "<p>Électrique ou gaz ?</p>" };
    const result = await collectArticleBodies([summary("fuite-sous-evier"), summary("choisir-son-chauffe-eau")], async (slug) => online[slug], []);
    expect(result).toStrictEqual({
      bodies: [
        { slug: "fuite-sous-evier", bodyHtml: "<p>Coupez l'eau.</p>" },
        { slug: "choisir-son-chauffe-eau", bodyHtml: "<p>Électrique ou gaz ?</p>" },
      ],
      failures: [],
    });
  });

  it("un article en échec garde le corps du build précédent, sinon reste sans corps", async () => {
    const error = new Error("HTTP 500");
    const fetchBody = async (slug) => {
      if (slug !== "a") throw error;
      return "<p>a, version 2</p>";
    };
    const previous = [
      { slug: "a", bodyHtml: "<p>a, version 1</p>" },
      { slug: "b", bodyHtml: "<p>b, version 1</p>" },
    ];
    const result = await collectArticleBodies([summary("a"), summary("b"), summary("c")], fetchBody, previous);
    expect(result.bodies).toStrictEqual([
      { slug: "a", bodyHtml: "<p>a, version 2</p>" },
      { slug: "b", bodyHtml: "<p>b, version 1</p>" },
    ]);
    expect(result.failures).toStrictEqual([
      { slug: "b", error, reused: true },
      { slug: "c", error, reused: false },
    ]);
  });

  it("quatre corps récupérés à la fois au plus, rangés dans l'ordre de la liste", async () => {
    const slugs = ["a", "b", "c", "d", "e", "f"];
    const gates = new Map();
    let active = 0;
    let maxActive = 0;
    const fetchBody = async (slug) => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => gates.set(slug, resolve));
      active--;
      return `<p>${slug}</p>`;
    };
    const running = collectArticleBodies(slugs.map(summary), fetchBody, []);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect([...gates.keys()]).toStrictEqual(["a", "b", "c", "d"]);
    // Fins dans le désordre : l'ordre des corps reste celui de la liste.
    for (const slug of ["d", "b", "f", "a", "e", "c"]) {
      while (!gates.has(slug)) await new Promise((resolve) => setTimeout(resolve, 0));
      gates.get(slug)();
    }
    const { bodies, failures } = await running;
    expect(bodies.map((body) => body.slug)).toStrictEqual(slugs);
    expect(failures).toStrictEqual([]);
    expect(maxActive).toBe(4);
  });

  it("ne garde pas le corps d'un article qui n'est plus publié", async () => {
    const previous = [{ slug: "depublie", bodyHtml: "<p>Ancien article</p>" }];
    const result = await collectArticleBodies([summary("a")], async () => "<p>A</p>", previous);
    expect(result.bodies).toStrictEqual([{ slug: "a", bodyHtml: "<p>A</p>" }]);
  });
});

describe("parseArticleBodies", () => {
  it("lit les corps écrits au build précédent", () => {
    const text = JSON.stringify([{ slug: "a", bodyHtml: "<p>A</p>" }]);
    expect(parseArticleBodies(text)).toStrictEqual([{ slug: "a", bodyHtml: "<p>A</p>" }]);
  });

  it("écarte une entrée d'une autre forme, et tout d'un fichier illisible", () => {
    const text = JSON.stringify([{ slug: "a", bodyHtml: "<p>A</p>" }, { slug: "b" }, { slug: 1, bodyHtml: "<p>C</p>" }, null, "texte"]);
    expect(parseArticleBodies(text)).toStrictEqual([{ slug: "a", bodyHtml: "<p>A</p>" }]);
    for (const unreadable of ["", "{", "null", '{"a":"<p>A</p>"}']) expect(parseArticleBodies(unreadable)).toStrictEqual([]);
  });
});

// Les corps des articles (src/content.articles.snapshot.json) ne doivent
// jamais entrer dans le JavaScript du navigateur : seul src/entry-server.tsx
// (bundle du prérendu) les importe. Chaque page d'article porte le sien.
const ROOT = fileURLToPath(new URL("../../", import.meta.url));

/** Messages de la règle no-restricted-imports pour `code` écrit dans `file` (chemin relatif à la racine). */
async function restrictedImports(eslint, code, file) {
  const [result] = await eslint.lintText(code, { filePath: join(ROOT, file) });
  return result.messages.filter((message) => message.ruleId === "no-restricted-imports");
}

function sourceFiles(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) sourceFiles(full, files);
    else if ([".ts", ".tsx"].includes(extname(name))) files.push(full);
  }
  return files;
}

// Commentaires retirés : un commentaire qui cite le fichier n'est pas un import.
function withoutComments(code) {
  return code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

// Import statique (import … from, import "…", export … from) ou dynamique (import("…")) du fichier des corps.
const BODIES_IMPORT_RE = /\b(?:import|from)\s*\(?\s*["'`][^"'`]*content\.articles\.snapshot\.json/;

const BODIES_FILE = "src/content.articles.snapshot.json";

// import.meta.glob("…") ou import.meta.glob(["…", "…"], …) de Vite : premier argument.
const GLOB_CALL_RE = /import\.meta\.glob\s*\(\s*(\[[^\]]*\]|"[^"]*"|'[^']*'|`[^`]*`)/g;

/** Motif glob de Vite (`*`, `**`, `?`, `{a,b}`) vers une expression régulière sur un chemin entier. */
function globToRegExp(glob) {
  let source = "";
  let braces = 0;
  for (let i = 0; i < glob.length; i++) {
    const char = glob[i];
    if (char === "*" && glob[i + 1] === "*") {
      // `**/` : aucun ou plusieurs dossiers ; `**` en fin de motif : tout.
      const folders = glob[i + 2] === "/";
      source += folders ? "(?:.*/)?" : ".*";
      i += folders ? 2 : 1;
    } else if (char === "*") {
      source += "[^/]*";
    } else if (char === "?") {
      source += "[^/]";
    } else if (char === "{") {
      braces++;
      source += "(?:";
    } else if (char === "}" && braces > 0) {
      braces--;
      source += ")";
    } else if (char === "," && braces > 0) {
      source += "|";
    } else {
      source += char.replace(/[.+^$()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${source}$`);
}

/**
 * `code` (fichier `file`, relatif à la racine) charge-t-il le fichier des
 * corps ? Import statique ou dynamique qui le nomme, ou import.meta.glob dont
 * un motif le désigne (relatif au fichier, ou à la racine du projet s'il
 * commence par `/`).
 */
function importsArticleBodies(code, file) {
  if (BODIES_IMPORT_RE.test(code)) return true;
  const dir = posix.dirname(file.split(sep).join("/"));
  for (const [, argument] of code.matchAll(GLOB_CALL_RE)) {
    for (const [, pattern] of argument.matchAll(/["'`]([^"'`]*)["'`]/g)) {
      if (pattern.startsWith("!")) continue;
      const fromRoot = pattern.startsWith("/") ? pattern.slice(1) : posix.join(dir, pattern);
      if (globToRegExp(fromRoot).test(BODIES_FILE)) return true;
    }
  }
  return false;
}

describe("corps des articles hors du JavaScript du navigateur", () => {
  it("ESLint refuse de les importer ailleurs que dans src/entry-server.tsx, src/lib/snapshot.ts compris", async () => {
    const eslint = new ESLint({ cwd: ROOT });
    const use = "\nexport const count = bodies.length;\n";
    expect(await restrictedImports(eslint, `import bodies from "../content.articles.snapshot.json";${use}`, "src/lib/snapshot.ts")).toHaveLength(1);
    expect(await restrictedImports(eslint, `import bodies from "../content.articles.snapshot.json?raw";${use}`, "src/pages/BlogPost.tsx")).toHaveLength(1);
    expect(await restrictedImports(eslint, `import bodies from "./content.articles.snapshot.json";${use}`, "src/main.tsx")).toHaveLength(1);
    expect(await restrictedImports(eslint, `import bodies from "./content.articles.snapshot.json";${use}`, "src/entry-server.tsx")).toHaveLength(0);
  }, 30_000);

  it("ESLint refuse d'importer src/entry-server.tsx dans un autre module de src/ (il tire les corps et react-dom/server)", async () => {
    // Un vrai fichier, lu sur le disque par ESLint, puis supprimé quoi qu'il arrive.
    const file = join(ROOT, "src", `garde-entry-server-${process.pid}.tmp.ts`);
    writeFileSync(file, 'import { render } from "./entry-server";\nexport const probe = render;\n');
    try {
      const [result] = await new ESLint({ cwd: ROOT }).lintFiles([file]);
      const refused = result.messages.filter((message) => message.ruleId === "no-restricted-imports");
      expect(refused).toHaveLength(1);
      expect(refused[0].message).toContain("entry-server");
    } finally {
      rmSync(file, { force: true });
    }
    const eslint = new ESLint({ cwd: ROOT });
    const use = "\nexport const probe = render;\n";
    expect(await restrictedImports(eslint, `import { render } from "../entry-server.tsx";${use}`, "src/lib/snapshot.ts")).toHaveLength(1);
    expect(await restrictedImports(eslint, `import { render } from "./entry-server";${use}`, "src/main.tsx")).toHaveLength(1);
    expect(await restrictedImports(eslint, `import { renderToString } from "react-dom/server";\nimport { App } from "./App";\nexport const probe = [renderToString, App];\n`, "src/entry-server.tsx")).toHaveLength(0);
  }, 30_000);

  it("aucun module de src/ ne les importe, src/lib/snapshot.ts compris (import statique, import() ou import.meta.glob)", () => {
    for (const code of [
      'import bodies from "../content.articles.snapshot.json";',
      'import "./content.articles.snapshot.json?raw";',
      "const bodies = await import('../content.articles.snapshot.json');",
    ]) {
      expect(BODIES_IMPORT_RE.test(code)).toBe(true);
    }
    expect(BODIES_IMPORT_RE.test(withoutComments('// jamais : import bodies from "../content.articles.snapshot.json";'))).toBe(false);

    // import.meta.glob (Vite) : un motif qui peut désigner le fichier des corps, relatif au
    // fichier ou à la racine du projet, en chaîne ou en tableau.
    for (const [code, file] of [
      ['const all = import.meta.glob("../content.*.snapshot.json", { eager: true });', "src/lib/snapshot.ts"],
      ['const all = import.meta.glob(["./*.json"], { eager: true });', "src/main.tsx"],
      ["const all = import.meta.glob('/src/**/*.snapshot.json');", "src/pages/Blog.tsx"],
    ]) {
      expect(importsArticleBodies(code, file), code).toBe(true);
    }
    expect(importsArticleBodies('const sections = import.meta.glob("./sections/*.tsx");', "src/App.tsx")).toBe(false);
    expect(importsArticleBodies(withoutComments('// jamais : import.meta.glob("../*.json")'), "src/lib/snapshot.ts")).toBe(false);

    const files = sourceFiles(join(ROOT, "src"))
      .map((file) => relative(ROOT, file))
      .filter((file) => file !== join("src", "entry-server.tsx"));
    expect(files).toContain(join("src", "lib", "snapshot.ts"));
    const importing = files.filter((file) => importsArticleBodies(withoutComments(readFileSync(join(ROOT, file), "utf8")), file));
    expect(importing).toStrictEqual([]);
  });
});
