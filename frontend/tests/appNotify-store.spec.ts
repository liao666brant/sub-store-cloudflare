import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const feedback = vi.hoisted(() => ({ showNotify: vi.fn() }));

vi.mock("@/plugin/tdesign", () => feedback);

import { useAppNotifyStore } from "@/store/appNotify";

describe("useAppNotifyStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    feedback.showNotify.mockReset();
  });

  it("forwards the existing notification payload to the TDesign adapter", () => {
    // Given: a caller using the established store API.
    const notification: NotifySettings = {
      title: "saved",
      content: "settings updated",
      type: "success",
      duration: 1200,
    };

    // When: the caller displays feedback through the store.
    useAppNotifyStore().showNotify(notification);

    // Then: its type, content, and duration remain available to the new adapter.
    expect(feedback.showNotify).toHaveBeenCalledWith(notification);
  });
});
