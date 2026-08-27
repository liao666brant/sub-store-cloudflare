import { describe, expect, it } from "vitest";
import {
  getListSearchDisplayName,
  listItemMatchesSearch,
  shouldSearchListRemark,
} from "../src/utils/listSearch";

describe("listSearch", () => {
  it("prefers the first non-empty display field", () => {
    expect(getListSearchDisplayName({ displayName: "A", name: "B" })).toBe("a");
    expect(getListSearchDisplayName({ "display-name": "C", name: "B" })).toBe("c");
    expect(getListSearchDisplayName({ name: "B" })).toBe("b");
    expect(getListSearchDisplayName({})).toBe("");
  });

  it("matches query against name, tags, and remark", () => {
    const item = { name: "香港 01", tag: "IEPL, Premium", remark: "旧线路" };
    expect(listItemMatchesSearch(item, "香港")).toBe(true);
    expect(listItemMatchesSearch(item, "iepl")).toBe(true);
    expect(listItemMatchesSearch(item, "旧线路")).toBe(true);
    expect(listItemMatchesSearch(item, "美国")).toBe(false);
  });

  it("treats an empty query as a match-all", () => {
    expect(listItemMatchesSearch({ name: "任意" }, "  ")).toBe(true);
  });

  it("can exclude remark from the search scope", () => {
    const item = { name: "香港", remark: "secret-remark" };
    expect(listItemMatchesSearch(item, "secret")).toBe(true);
    expect(listItemMatchesSearch(item, "secret", { includeRemark: false })).toBe(false);
  });

  it("controls remark scope through appearance settings", () => {
    expect(shouldSearchListRemark({ isSimpleMode: true })).toBe(false);
    expect(shouldSearchListRemark({ isSimpleMode: true, isSimpleShowRemark: true })).toBe(true);
    expect(shouldSearchListRemark({ isSimpleMode: false })).toBe(true);
    expect(shouldSearchListRemark({})).toBe(true);
  });
});