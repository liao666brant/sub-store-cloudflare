import { describe, expect, it } from "vitest";
import { DEFAULT_API_REQUEST_TIMEOUT, getApiRequestTimeout } from "../src/utils/requestTimeout";

describe("requestTimeout", () => {
  it("returns the default when storage is empty or invalid", () => {
    expect(getApiRequestTimeout()).toBe(DEFAULT_API_REQUEST_TIMEOUT);
    localStorage.setItem("apiRequestTimeout", "not-a-number");
    expect(getApiRequestTimeout()).toBe(DEFAULT_API_REQUEST_TIMEOUT);
    localStorage.setItem("apiRequestTimeout", "-5");
    expect(getApiRequestTimeout()).toBe(DEFAULT_API_REQUEST_TIMEOUT);
  });

  it("honors a stored positive timeout", () => {
    localStorage.setItem("apiRequestTimeout", "12000");
    expect(getApiRequestTimeout()).toBe(12000);
  });
});