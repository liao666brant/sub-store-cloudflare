import { describe, expect, it } from "vitest";
import {
  extractPreviewNodeInfos,
  extractPreviewSideNodeInfos,
  formatPreviewNodeNames,
} from "../src/utils/previewNodeNames";

describe("previewNodeNames", () => {
  it("extracts nodes from a mihomo-style JSON object", () => {
    const infos = extractPreviewNodeInfos({
      proxies: [
        { name: "HK Node", type: "trojan", server: "a.com", port: 443 },
        { name: "US Node", type: "ss" },
        { name: "  ", type: "ignored" },
      ],
    });
    expect(infos).toEqual([
      { name: "HK Node", type: "trojan" },
      { name: "US Node", type: "ss" },
    ]);
  });

  it("extracts sing-box style outbounds via the tag field", () => {
    const infos = extractPreviewNodeInfos({
      outbounds: [
        { tag: "SB Node", type: "vmess", server: "b.com", port: 443 },
      ],
    });
    expect(infos).toEqual([{ name: "SB Node", type: "vmess" }]);
  });

  it("parses YAML strings into node lists", () => {
    const infos = extractPreviewNodeInfos(
      "proxies:\n  - name: YAML Node\n    type: ss\n    server: c.com\n    port: 8388\n",
    );
    expect(infos).toEqual([{ name: "YAML Node", type: "ss" }]);
  });

  it("falls back to the whole payload for the after side only", () => {
    const previewData = { processed: [{ name: "After" }] };
    expect(formatPreviewNodeNames(extractPreviewSideNodeInfos(previewData, "after"))).toBe("After");
    expect(extractPreviewSideNodeInfos({ original: [] }, "after")).toEqual([]);
    expect(extractPreviewSideNodeInfos({}, "original")).toEqual([]);
  });

  it("keeps raw URI text out of the node list", () => {
    expect(extractPreviewNodeInfos("trojan://password@example.com:443#Node")).toEqual([]);
  });
});