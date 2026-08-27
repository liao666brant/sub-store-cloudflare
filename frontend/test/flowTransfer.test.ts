import { describe, expect, it } from "vitest";
import { getString } from "../src/utils/flowTransfer";

describe("flowTransfer", () => {
  it("keeps values below 1024 in the requested unit", () => {
    expect(getString(500, 999, "B")).toBe("500 B / 999 B");
  });

  it("promotes units once 1024 is reached", () => {
    expect(getString(1024, 1024, "B")).toBe("1 KB / 1 KB");
    expect(getString(1572864, 1048576, "B")).toBe("1.5 MB / 1 MB");
  });

  it("rounds to two decimals and keeps negative values", () => {
    expect(getString(-1611, 1024, "B")).toBe("-1.57 KB / 1 KB");
  });

  it("caps at the largest unit instead of overflowing", () => {
    const huge = 1024 ** 8 * 5;
    expect(getString(huge, 0, "B")).toContain("YB");
  });
});