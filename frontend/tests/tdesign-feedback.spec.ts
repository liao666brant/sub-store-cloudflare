import { beforeEach, describe, expect, it, vi } from "vitest";

const loading = vi.hoisted(() => vi.fn());
const hide = vi.hoisted(() => vi.fn());
const info = vi.hoisted(() => vi.fn());
const success = vi.hoisted(() => vi.fn());
const error = vi.hoisted(() => vi.fn());
const warning = vi.hoisted(() => vi.fn());

vi.mock("tdesign-vue-next", () => ({
  LoadingPlugin: loading,
  MessagePlugin: { info, success, error, warning },
}));

import { closeLoading, showError, showLoading, showNotify, showSuccess } from "@/plugin/tdesign";

describe("TDesign feedback adapter", () => {
  beforeEach(() => {
    loading.mockReset();
    hide.mockReset();
    info.mockReset();
    success.mockReset();
    error.mockReset();
    warning.mockReset();
    loading.mockReturnValue({ hide });
  });

  it("replaces a named full-screen loading instance before starting it again", () => {
    // Given: an active named loading indicator.
    showLoading("first", { id: "refresh", cover: true });

    // When: the same named indicator starts again.
    showLoading("second", { id: "refresh", cover: true });

    // Then: the previous overlay is closed and the replacement preserves its cover behavior.
    expect(hide).toHaveBeenCalledTimes(1);
    expect(loading).toHaveBeenLastCalledWith({
      content: "second",
      fullscreen: true,
      preventScrollThrough: true,
      showOverlay: true,
    });
  });

  it("closes a named loading indicator exactly once", () => {
    // Given: an active named loading indicator.
    showLoading("loading", { id: "theme", cover: true });

    // When: its caller closes it twice.
    closeLoading("theme");
    closeLoading("theme");

    // Then: the underlying overlay is hidden only once.
    expect(hide).toHaveBeenCalledTimes(1);
  });

  it("routes success and error feedback through TDesign messages", () => {
    // Given: feedback text for completed and failed actions.

    // When: the two feedback outcomes are emitted.
    showSuccess("copied");
    showError("copy failed");

    // Then: each outcome uses its semantic TDesign message channel.
    expect(success).toHaveBeenCalledWith("copied");
    expect(error).toHaveBeenCalledWith("copy failed");
  });

  it("routes app notifications to the bottom semantic TDesign message channel", () => {
    // Given: a warning notification with a caller-selected duration.
    const notification = { title: "warning", content: "details", type: "warning" as const, duration: 800 };

    // When: the shared notification adapter renders it.
    showNotify(notification);

    // Then: it keeps message semantics and avoids the navigation-title area.
    expect(warning).toHaveBeenCalledWith(expect.objectContaining({
      closeBtn: true,
      duration: 800,
      placement: "bottom",
      zIndex: 65535,
    }));
  });
});
