import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getFrontendRequestConcurrency,
  getFrontendRequestWaitTime,
  isAbortError,
  runFrontendRequestTask,
} from "../src/utils/requestConcurrency";

describe("requestConcurrency settings", () => {
  it("falls back to defaults on empty or invalid storage", () => {
    expect(getFrontendRequestConcurrency()).toBe(3);
    expect(getFrontendRequestWaitTime()).toBe(0);

    localStorage.setItem("concurrency", "not-a-number");
    localStorage.setItem("concurrencyWaitTime", "-1");
    expect(getFrontendRequestConcurrency()).toBe(3);
    expect(getFrontendRequestWaitTime()).toBe(0);
  });

  it("honors valid stored settings", () => {
    localStorage.setItem("concurrency", "5");
    localStorage.setItem("concurrencyWaitTime", "200");
    expect(getFrontendRequestConcurrency()).toBe(5);
    expect(getFrontendRequestWaitTime()).toBe(200);
  });
});

describe("isAbortError", () => {
  it("recognizes every abort error shape", () => {
    expect(isAbortError(new DOMException("aborted", "AbortError"))).toBe(true);
    expect(isAbortError({ code: "ERR_CANCELED" })).toBe(true);
    expect(isAbortError({ __CANCEL__: true })).toBe(true);
    expect(isAbortError({ message: "canceled" })).toBe(true);
    expect(isAbortError(new Error("boom"))).toBe(false);
    expect(isAbortError(undefined)).toBe(false);
  });
});

describe("runFrontendRequestTask", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("limits concurrent tasks to the configured slot count", async () => {
    localStorage.setItem("concurrency", "2");
    let active = 0;
    let maxActive = 0;

    await Promise.all(Array.from({ length: 5 }, () =>
      runFrontendRequestTask(async () => {
        active++;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 10));
        active--;
      }),
    ));

    expect(maxActive).toBe(2);
  });

  it("starts the highest priority queued task first", async () => {
    localStorage.setItem("concurrency", "1");
    const started: string[] = [];
    const gate = { release: () => {} };
    const blocker = new Promise<void>((resolve) => {
      gate.release = resolve;
    });

    const first = runFrontendRequestTask(() => blocker, "blocker");
    const low = runFrontendRequestTask(async () => started.push("low"), "low", { priority: 0 });
    // 让 low 先入队，再入队 high
    await Promise.resolve();
    const high = runFrontendRequestTask(async () => started.push("high"), "high", { priority: 1 });

    await new Promise((resolve) => setTimeout(resolve, 20));
    gate.release();
    await Promise.all([first, low, high]);

    expect(started[0]).toBe("high");
  });

  it("rejects an already aborted task and frees the slot", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      runFrontendRequestTask(async () => "never", "aborted", { signal: controller.signal }),
    ).rejects.toThrow("aborted");

    // 槽位已释放：后续任务无需等待即可完成
    const result = await runFrontendRequestTask(async () => "ok", "after-abort");
    expect(result).toBe("ok");
  });
});