import { env, exports as workerExports } from "cloudflare:workers";
import { describe, expect, it, vi } from "vitest";

const ADMIN_TOKEN = "test-admin-token";
const DOWNLOAD_TOKEN = "test-download-token";

describe("Worker and D1 integration", () => {
  it("applies migrations and keeps built-in templates out of D1", async () => {
    const tables = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    ).all<{ name: string }>();
    expect(tables.results.map((row) => row.name)).toEqual(expect.arrayContaining([
      "app_settings",
      "collections",
      "d1_migrations",
      "download_grants",
      "recycle_bin",
      "sources",
      "templates",
    ]));

    const columns = await env.DB.prepare("PRAGMA table_info(sources)").all<{ name: string }>();
    expect(columns.results.map((row) => row.name)).toContain("meta_json");
    expect(await env.DB.prepare("SELECT COUNT(*) AS count FROM templates").first("count")).toBe(0);
    expect(await env.DB.prepare("SELECT COUNT(*) AS count FROM collections WHERE id = 'daily'").first("count")).toBe(1);
  });

  it("requires admin auth and returns hardened responses", async () => {
    const unauthorized = await workerRequest("/api/env", {}, false);
    expect(unauthorized.status).toBe(401);
    expect(unauthorized.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(unauthorized.headers.get("referrer-policy")).toBe("no-referrer");
    expect(unauthorized.headers.get("x-content-type-options")).toBe("nosniff");
    expect(unauthorized.headers.get("x-frame-options")).toBe("DENY");

    const authorized = await workerRequest("/api/env");
    expect(authorized.status).toBe(200);
    expect(getPath(await jsonObject(authorized), "status")).toBe("success");
  });

  it("infers a remote source name and available id from its response metadata", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(() => Promise.resolve(new Response(
      "trojan://password@example.com:443#Remote%20Node",
      { headers: { "content-disposition": "attachment;filename*=UTF-8''%E9%A3%9E%E9%B8%9F%E4%BA%91" } },
    )));
    try {
      const response = await workerRequest("/api/utils/remote-source-profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: "https://example.com/sub?token=private" }),
      });
      const profile = getPath(await jsonObject(response), "data");

      expect(response.status).toBe(200);
      expect(getPath(profile, "id")).toBe("example-com");
      expect(getPath(profile, "name")).toBe("飞鸟云");
    } finally {
      fetchMock.mockRestore();
    }
  });

  it("generates source ids when clients omit them", async () => {
    const payload = JSON.stringify({
      name: "Auto Generated Source",
      type: "local",
      content: "trojan://password@example.com:443#Generated",
    });
    const first = await workerRequest("/api/sources", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
    });

    expect(first.status).toBe(200);
    expect(getPath(await jsonObject(first), "data", "id")).toBe("auto-generated-source");
  });

  it("suffixes generated source ids when the base id exists", async () => {
    await env.DB.prepare(
      `INSERT INTO sources (id, name, type, url, content, enabled, filters_json, meta_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      "repeated-source",
      "Existing Source",
      "local",
      "",
      "trojan://password@example.com:443#Existing",
      1,
      "[]",
      "{}",
      0,
      0,
    ).run();

    const response = await workerRequest("/api/sources", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Repeated Source",
        type: "local",
        content: "trojan://password@example.com:443#Generated",
      }),
    });

    expect(response.status).toBe(200);
    expect(getPath(await jsonObject(response), "data", "id")).toBe("repeated-source-2");
  });

  it("publishes build-time script metadata and executes saved script actions", async () => {
    const scriptsResponse = await workerRequest("/api/scripts");
    expect(scriptsResponse.status).toBe(200);
    const scripts = getPath(await jsonObject(scriptsResponse), "data");
    expect(Array.isArray(scripts) ? scripts.map((script) => getPath(script, "id")) : []).toEqual(
      expect.arrayContaining(["tls-fingerprint", "name-regex-filter"]),
    );

    const create = await workerRequest("/api/sources", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "scripted-source",
        name: "Scripted Source",
        type: "local",
        content: "trojan://password@example.com:443#Scripted%20Node",
        filters: [{
          type: "script",
          scriptId: "tls-fingerprint",
          scriptKind: "operator",
          arguments: { fingerprint: "safari" },
        }],
      }),
    });
    expect(create.status).toBe(200);

    const download = await workerRequest(`/download/source/scripted-source/json/${DOWNLOAD_TOKEN}`, {}, false);
    expect(download.status).toBe(200);
    expect(await download.text()).toContain('"tls-fingerprint": "safari"');

    const invalid = await workerRequest("/api/sources", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "missing-script-source",
        name: "Missing Script",
        type: "local",
        content: "trojan://password@example.com:443#Node",
        filters: [{ type: "script", scriptId: "missing-script" }],
      }),
    });
    expect(invalid.status).toBe(400);
    expect(getPath(await jsonObject(invalid), "error", "message")).toContain("Unknown script");
  });

  it("hardens the download-only host boundary", async () => {
    const response = await workerExports.default.fetch(new Request("https://downloads.example.com/"));
    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(response.headers.get("permissions-policy")).toContain("camera=()");

    const spoofedHost = await workerRequest("/api/env", {
      headers: { "x-forwarded-host": "downloads.example.com" },
    });
    expect(spoofedHost.status).toBe(200);
  });

  it("keeps record ids immutable and preserves omitted fields in partial updates", async () => {
    const sourceCreate = await workerRequest("/api/sources", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "patch-source",
        name: "Patch Source",
        type: "local",
        content: "trojan://password@example.com:443#Patch%20Node",
        enabled: true,
        meta: { remark: "keep-me" },
      }),
    });
    expect(sourceCreate.status).toBe(200);

    const sourcePatch = await workerRequest("/api/sources/patch-source", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "renamed-source", name: "Updated Source" }),
    });
    const patchedSource = getPath(await jsonObject(sourcePatch), "data") as Record<string, unknown>;
    expect(sourcePatch.status).toBe(200);
    expect(patchedSource.id).toBe("patch-source");
    expect(patchedSource.name).toBe("Updated Source");
    expect(patchedSource.content).toContain("Patch%20Node");
    expect(getPath(patchedSource, "meta", "remark")).toBe("keep-me");
    expect((await workerRequest("/api/sources/renamed-source")).status).toBe(404);

    const linkResponse = await workerRequest("/api/link/source/patch-source?target=json", {
      headers: { "x-forwarded-host": "attacker.example" },
    });
    expect(getPath(await jsonObject(linkResponse), "data", "url")).toBe(
      `https://downloads.example.com/download/source/patch-source/json?token=${DOWNLOAD_TOKEN}`,
    );

    const collectionCreate = await workerRequest("/api/collections", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "patch-collection",
        name: "Patch Collection",
        sourceIds: ["patch-source"],
        templateId: "mihomo-basic",
        ignoreFailed: false,
        enabled: true,
      }),
    });
    expect(collectionCreate.status).toBe(200);

    const collectionPatch = await workerRequest("/api/collections/patch-collection", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "renamed-collection", name: "Updated Collection" }),
    });
    const patchedCollection = getPath(await jsonObject(collectionPatch), "data") as Record<string, unknown>;
    expect(collectionPatch.status).toBe(200);
    expect(patchedCollection.id).toBe("patch-collection");
    expect(patchedCollection.sourceIds).toEqual(["patch-source"]);
    expect(patchedCollection.templateId).toBe("mihomo-basic");
    expect(patchedCollection.ignoreFailed).toBe(false);

    const blockedDelete = await workerRequest("/api/sources/patch-source", { method: "DELETE" });
    expect(blockedDelete.status).toBe(409);
    expect(getPath(await jsonObject(blockedDelete), "error", "message")).toContain("patch-collection");
  });

  it("treats an empty sourceIds list as all enabled sources", async () => {
    for (const [id, nodeName] of [["all-source-a", "All Node A"], ["all-source-b", "All Node B"]]) {
      const response = await workerRequest("/api/sources", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id,
          name: id,
          type: "local",
          content: `trojan://password@example.com:443#${encodeURIComponent(nodeName)}`,
          enabled: true,
        }),
      });
      expect(response.status).toBe(200);
    }

    const collection = await workerRequest("/api/collections", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "all-enabled",
        name: "All Enabled",
        sourceIds: [],
        templateId: "mihomo-basic",
        enabled: true,
      }),
    });
    expect(collection.status).toBe(200);

    const download = await workerRequest(`/download/collection/all-enabled/json/${DOWNLOAD_TOKEN}`, {}, false);
    expect(download.status).toBe(200);
    const body = await download.text();
    expect(body).toContain("All Node A");
    expect(body).toContain("All Node B");
  });

  it("rejects invalid and duplicate record ids", async () => {
    const invalid = await workerRequest("/api/sources", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "Invalid ID",
        name: "Invalid",
        type: "local",
        content: "trojan://password@example.com:443#Invalid",
      }),
    });
    expect(invalid.status).toBe(400);

    const invalidType = await workerRequest("/api/sources", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "invalid-type", name: "Invalid", type: "file", content: "x" }),
    });
    expect(invalidType.status).toBe(400);

    const invalidSourceIds = await workerRequest("/api/collections", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "invalid-source-ids",
        name: "Invalid",
        sourceIds: "all-source-a",
        templateId: "mihomo-basic",
      }),
    });
    expect(invalidSourceIds.status).toBe(400);

    const duplicatePayload = JSON.stringify({
      id: "duplicate-source",
      name: "Duplicate",
      type: "local",
      content: "trojan://password@example.com:443#Duplicate",
    });
    const first = await workerRequest("/api/sources", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: duplicatePayload,
    });
    expect(first.status).toBe(200);

    const duplicate = await workerRequest("/api/sources", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: duplicatePayload,
    });
    expect(duplicate.status).toBe(409);
  });

  it("serves code-owned built-ins and restores custom storage in one request", async () => {
    const templatesResponse = await workerRequest("/api/templates");
    const initialTemplates = getPath(await jsonObject(templatesResponse), "data");
    expect(Array.isArray(initialTemplates) ? initialTemplates.length : 0).toBe(6);

    const restoreResponse = await workerRequest("/api/storage", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        settings: { defaultTimeout: "15000" },
        sources: [{
          id: "test-local",
          name: "Test Local",
          type: "local",
          content: "vless://00000000-0000-4000-8000-000000000001@example.com:443?security=tls#Test%20Node",
          enabled: true,
        }],
        templates: [{
          id: "test-template",
          name: "Test Template",
          target: "mihomo",
          config: {
            proxyGroups: [{ name: "Proxy", type: "select", proxies: ["$all"] }],
            rules: ["MATCH,Proxy"],
          },
        }],
        collections: [{
          id: "test-collection",
          name: "Test Collection",
          sourceIds: ["test-local"],
          templateId: "test-template",
          enabled: true,
        }],
      }),
    });
    expect(restoreResponse.status).toBe(200);
    expect(getPath(await jsonObject(restoreResponse), "data", "sources")).toBe(1);

    const customCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM templates WHERE id = 'test-template'").first("count");
    expect(customCount).toBe(1);

    const download = await workerRequest(
      `/download/collection/test-collection/mihomo/${DOWNLOAD_TOKEN}`,
      {},
      false,
    );
    expect(download.status).toBe(200);
    expect(download.headers.get("content-type")).toContain("text/yaml");
    expect(await download.text()).toContain("Test Node");
  });

  it("rejects oversized API bodies", async () => {
    const response = await workerRequest("/api/storage", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: "x".repeat(4 * 1024 * 1024) }),
    });
    expect(response.status).toBe(413);
  });

  it("converts proxies and rules without saving records", async () => {
    const proxy = await workerRequest("/api/proxy/parse", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        content: "trojan://password@example.com:443#One%20Shot",
        target: "surge-mac",
      }),
    });
    expect(proxy.status).toBe(200);
    expect(getPath(await jsonObject(proxy), "data", "content")).toContain("One Shot");

    const rules = await workerRequest("/api/rule/parse", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: "DOMAIN-SUFFIX,example.com,Proxy", target: "qx" }),
    });
    expect(rules.status).toBe(200);
    expect(getPath(await jsonObject(rules), "data", "content")).toContain("HOST-SUFFIX");
  });

  it("creates scoped share links and enforces resource and target restrictions", async () => {
    await workerRequest("/api/sources", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "shared-source",
        name: "Shared Source",
        type: "local",
        content: "trojan://password@example.com:443#Shared%20Node",
      }),
    });
    const create = await workerRequest("/api/shares", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ resourceType: "source", resourceId: "shared-source", target: "json", expiresIn: 3600 }),
    });
    expect(create.status).toBe(200);
    const payload = await jsonObject(create);
    const token = String(getPath(payload, "data", "token"));
    const id = String(getPath(payload, "data", "id"));
    expect(token.length).toBeGreaterThan(20);

    const allowed = await workerRequest(`/download/source/shared-source/json?token=${encodeURIComponent(token)}`, {}, false);
    expect(allowed.status).toBe(200);
    const wrongTarget = await workerRequest(`/download/source/shared-source/mihomo?token=${encodeURIComponent(token)}`, {}, false);
    expect(wrongTarget.status).toBe(403);

    await workerRequest(`/api/shares/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ enabled: false }),
    });
    const disabled = await workerRequest(`/download/source/shared-source/json?token=${encodeURIComponent(token)}`, {}, false);
    expect(disabled.status).toBe(403);
  });

  it("archives deleted configuration and restores it without overwrite", async () => {
    await workerRequest("/api/sources", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "recycled-source",
        name: "Recycled Source",
        type: "local",
        content: "trojan://password@example.com:443#Recycle%20Node",
      }),
    });
    expect((await workerRequest("/api/sources/recycled-source", { method: "DELETE" })).status).toBe(200);
    expect((await workerRequest("/api/sources/recycled-source")).status).toBe(404);

    const recycle = await workerRequest("/api/recycle-bin");
    const entries = getPath(await jsonObject(recycle), "data");
    const entry = Array.isArray(entries) ? entries.find((item) => getPath(item, "resourceId") === "recycled-source") : undefined;
    expect(entry).toBeTruthy();
    const entryId = String(getPath(entry, "id"));
    expect((await workerRequest(`/api/recycle-bin/${entryId}/restore`, { method: "POST" })).status).toBe(200);
    expect((await workerRequest("/api/sources/recycled-source")).status).toBe(200);
  });

  it("previews sources and collections without persisting records", async () => {
    const sourcePreview = await workerRequest("/api/preview/source", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "local", content: "trojan://password@example.com:443#Preview%20Node" }),
    });
    expect(sourcePreview.status).toBe(200);
    const sourcePayload = getPath(await jsonObject(sourcePreview), "data") as { original?: unknown[]; processed?: unknown[] };
    expect(sourcePayload.original).toHaveLength(1);
    expect(sourcePayload.processed).toHaveLength(1);

    const invalidPreview = await workerRequest("/api/preview/source", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "local", content: "not-a-node" }),
    });
    expect(invalidPreview.status).toBe(400);

    const collectionPreview = await workerRequest("/api/preview/collection", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sourceIds: ["all-source-a"], ignoreFailed: true }),
    });
    expect(collectionPreview.status).toBe(200);
    const processed = getPath(await jsonObject(collectionPreview), "data", "processed") as unknown;
    const names = JSON.stringify(processed);
    expect(names).toContain("All Node A");
  });

  it("builds collection links and rejects unknown download targets", async () => {
    const create = await workerRequest("/api/collections", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "link-collection",
        name: "Link Collection",
        sourceIds: ["all-source-a"],
        templateId: "mihomo-basic",
        enabled: true,
      }),
    });
    expect(create.status).toBe(200);

    const link = await workerRequest("/api/link/collection/link-collection?target=json");
    expect(getPath(await jsonObject(link), "data", "url")).toBe(
      `https://downloads.example.com/download/collection/link-collection/json?token=${DOWNLOAD_TOKEN}`,
    );

    const badTarget = await workerRequest("/api/link/collection/link-collection?target=not-a-target");
    expect(badTarget.status).toBe(400);

    const aliasDownload = await workerRequest(`/download/source/all-source-a/clash-meta/${DOWNLOAD_TOKEN}`, {}, false);
    expect(aliasDownload.status).toBe(200);

    const unknownTarget = await workerRequest(`/download/source/all-source-a/not-a-target/${DOWNLOAD_TOKEN}`, {}, false);
    expect(unknownTarget.status).toBe(400);
  });

  it("applies temporary source overrides and forced refresh to downloads", async () => {
    const download = await workerRequest(
      `/download/collection/link-collection/json/${DOWNLOAD_TOKEN}?content=${encodeURIComponent("trojan://password@override.example.com:443#Override%20Node")}`,
      {},
      false,
    );
    expect(download.status).toBe(200);
    const body = await download.text();
    expect(body).toContain("Override Node");
    expect(body).not.toContain("All Node A");

    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(() => Promise.resolve(new Response(
      "trojan://password@refresh.example.com:443#Remote%20Override",
      { headers: { etag: '"override-v1"' } },
    )));
    try {
      const urlOverride = await workerRequest(
        `/download/collection/link-collection/json/${DOWNLOAD_TOKEN}?url=${encodeURIComponent("https://remote-override.example/sub")}`,
        {},
        false,
      );
      expect(urlOverride.status).toBe(200);
      const urlBody = await urlOverride.text();
      expect(urlBody).toContain("Remote Override");
      expect(urlBody).not.toContain("All Node A");

      const createRemote = await workerRequest("/api/sources", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: "cache-source",
          name: "Cache Source",
          type: "remote",
          url: "https://cache.example/sub",
          enabled: true,
        }),
      });
      expect(createRemote.status).toBe(200);

      const first = await workerRequest(`/download/source/cache-source/json/${DOWNLOAD_TOKEN}`, {}, false);
      expect(first.status).toBe(200);
      expect(first.headers.get("x-sub-store-cache")).toBe("miss");

      const cached = await workerRequest(`/download/source/cache-source/json/${DOWNLOAD_TOKEN}`, {}, false);
      expect(cached.headers.get("x-sub-store-cache")).toBe("hit");

      const refreshed = await workerRequest(`/download/source/cache-source/json/${DOWNLOAD_TOKEN}?refresh=1`, {}, false);
      expect(refreshed.headers.get("x-sub-store-cache")).toBe("refresh");
      expect(fetchMock).toHaveBeenCalledTimes(3);
    } finally {
      fetchMock.mockRestore();
    }
  });

  it("returns flow usage for remote sources and rejects local ones", async () => {
    const create = await workerRequest("/api/sources", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "flow-source",
        name: "Flow Source",
        type: "remote",
        url: "https://flow.example/sub",
      }),
    });
    expect(create.status).toBe(200);

    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(() => Promise.resolve(new Response("", {
      headers: { "subscription-userinfo": "upload=100; download=200; total=1000; expire=1893456000" },
    })));
    try {
      const flow = await workerRequest("/api/source/flow/flow-source");
      expect(flow.status).toBe(200);
      const data = getPath(await jsonObject(flow), "data") as Record<string, unknown>;
      expect(data.total).toBe(1000);
      expect(getPath(data, "usage", "download")).toBe(200);
      expect(data.expires).toBe(1893456000);
    } finally {
      fetchMock.mockRestore();
    }

    const noFlow = await workerRequest("/api/source/flow/patch-source");
    expect(noFlow.status).toBe(400);
  });

  it("reads, patches, and merges app settings", async () => {
    const patch = await workerRequest("/api/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ defaultTimeout: "45000", theme: { name: "dark" } }),
    });
    expect(patch.status).toBe(200);
    const patched = getPath(await jsonObject(patch), "data") as Record<string, unknown>;
    expect(patched.defaultTimeout).toBe("45000");
    expect(getPath(patched, "theme", "dark")).toBe("dark");
    expect(getPath(patched, "theme", "light")).toBe("light");

    const read = await workerRequest("/api/settings");
    expect(getPath(await jsonObject(read), "data", "defaultTimeout")).toBe("45000");

    await workerRequest("/api/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ defaultTimeout: "30000", theme: { name: "light" } }),
    });
  });

  it("exports storage with a download disposition and no built-in templates", async () => {
    const response = await workerRequest("/api/storage");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain("attachment");
    const payload = await jsonObject(response);
    const sources = getPath(payload, "sources") as unknown[];
    expect(Array.isArray(sources) && sources.length > 0).toBe(true);
    const templates = getPath(payload, "templates") as Array<Record<string, unknown>>;
    expect(Array.isArray(templates)).toBe(true);
    expect(templates.some((template) => ["mihomo-basic", "acl4ssr-mihomo"].includes(String(template.id)))).toBe(false);
  });

  it("manages custom templates through the full CRUD cycle", async () => {
    const create = await workerRequest("/api/templates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "crud-template",
        name: "CRUD Template",
        target: "mihomo",
        config: "proxy-groups:\n  - name: Proxy\n    type: select\n    proxies:\n      - $all\nrules:\n  - MATCH,Proxy\n",
      }),
    });
    expect(create.status).toBe(200);
    const created = getPath(await jsonObject(create), "data") as Record<string, unknown>;
    expect(created.readonly).toBe(false);
    expect(getPath(created, "config", "proxyGroups")).toBeTruthy();

    const patched = await workerRequest("/api/templates/crud-template", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Renamed Template",
        target: "mihomo",
        config: { proxyGroups: [{ name: "Proxy", type: "select", proxies: ["$all"] }], rules: ["MATCH,Proxy"] },
      }),
    });
    expect(patched.status).toBe(200);
    expect(getPath(await jsonObject(patched), "data", "name")).toBe("Renamed Template");

    const blockedDelete = await workerRequest("/api/templates/mihomo-basic", { method: "DELETE" });
    expect(blockedDelete.status).toBe(400);

    expect((await workerRequest("/api/templates/crud-template", { method: "DELETE" })).status).toBe(200);
    expect((await workerRequest("/api/templates/crud-template")).status).toBe(404);
  });

  it("sorts records through POST and PUT endpoints", async () => {
    const sorted = await workerRequest("/api/sort/sources", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(["all-source-b", "all-source-a"]),
    });
    expect(sorted.status).toBe(200);
    const sources = getPath(await jsonObject(sorted), "data") as Array<Record<string, unknown>>;
    const idOf = (list: Array<Record<string, unknown>>, id: string) => list.findIndex((item) => item.id === id);
    expect(idOf(sources, "all-source-b")).toBeGreaterThanOrEqual(0);
    expect(idOf(sources, "all-source-b")).toBeLessThan(idOf(sources, "all-source-a"));

    const replaced = await workerRequest("/api/sources", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify([{ id: "all-source-a" }, { id: "all-source-b" }]),
    });
    expect(replaced.status).toBe(200);
    const replacedSources = getPath(await jsonObject(replaced), "data") as Array<Record<string, unknown>>;
    expect(idOf(replacedSources, "all-source-a")).toBeLessThan(idOf(replacedSources, "all-source-b"));

    const invalidPut = await workerRequest("/api/collections", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify("not-an-array"),
    });
    expect(invalidPut.status).toBe(400);
  });

  it("rejects expired shares and removes them permanently", async () => {
    const create = await workerRequest("/api/shares", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ resourceType: "source", resourceId: "shared-source", target: "json", expiresIn: 3600 }),
    });
    expect(create.status).toBe(200);
    const payload = await jsonObject(create);
    const token = String(getPath(payload, "data", "token"));
    const id = String(getPath(payload, "data", "id"));

    const listed = await workerRequest("/api/shares");
    const grants = getPath(await jsonObject(listed), "data") as unknown[];
    expect(Array.isArray(grants) && grants.some((grant) => getPath(grant, "id") === id)).toBe(true);

    await workerRequest(`/api/shares/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ expiresAt: Date.now() - 1000 }),
    });
    expect((await workerRequest(`/download/source/shared-source/json?token=${encodeURIComponent(token)}`, {}, false)).status).toBe(403);

    expect((await workerRequest(`/api/shares/${id}`, { method: "DELETE" })).status).toBe(200);
    expect((await workerRequest(`/api/shares/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ enabled: true }) })).status).toBe(404);
  });

  it("permanently deletes recycle bin entries", async () => {
    await workerRequest("/api/sources", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "binned-source",
        name: "Binned Source",
        type: "local",
        content: "trojan://password@example.com:443#Binned",
      }),
    });
    expect((await workerRequest("/api/sources/binned-source", { method: "DELETE" })).status).toBe(200);

    const recycle = await workerRequest("/api/recycle-bin");
    const entries = getPath(await jsonObject(recycle), "data") as unknown[];
    const entry = Array.isArray(entries) ? entries.find((item) => getPath(item, "resourceId") === "binned-source") : undefined;
    expect(entry).toBeTruthy();
    const entryId = String(getPath(entry, "id"));

    expect((await workerRequest(`/api/recycle-bin/${entryId}`, { method: "DELETE" })).status).toBe(200);
    const after = await workerRequest("/api/recycle-bin");
    const afterEntries = getPath(await jsonObject(after), "data") as unknown[];
    expect(afterEntries.some((item) => getPath(item, "id") === entryId)).toBe(false);
    expect((await workerRequest(`/api/recycle-bin/${entryId}/restore`, { method: "POST" })).status).toBe(404);
  });

  it("looks up node info through the configured provider", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(() => Promise.resolve(new Response(JSON.stringify({
      success: true,
      ip: "1.2.3.4",
      country: "United States",
      region: "California",
      city: "Los Angeles",
      connection: { asn: 12345, isp: "Example ISP" },
    }), { headers: { "content-type": "application/json" } })));
    try {
      const response = await workerRequest("/api/utils/node-info", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ server: "1.2.3.4" }),
      });
      expect(response.status).toBe(200);
      const data = getPath(await jsonObject(response), "data");
      expect(getPath(data, "country")).toBe("United States");
      expect(getPath(data, "connection", "asn")).toBe(12345);
    } finally {
      fetchMock.mockRestore();
    }
  });
});

async function workerRequest(path: string, init: RequestInit = {}, includeAdmin = true) {
  const headers = new Headers(init.headers);
  if (includeAdmin) headers.set("authorization", `Bearer ${ADMIN_TOKEN}`);
  return workerExports.default.fetch(new Request(`https://example.com${path}`, { ...init, headers }));
}

async function jsonObject(response: Response) {
  const input: unknown = await response.json();
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Expected a JSON object");
  return input as Record<string, unknown>;
}

function getPath(input: unknown, ...path: string[]): unknown {
  let current: unknown = input;
  for (const key of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return undefined;
    current = Reflect.get(current, key);
  }
  return current;
}
