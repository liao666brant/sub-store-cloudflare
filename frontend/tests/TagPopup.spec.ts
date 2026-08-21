import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { describe, expect, it } from "vitest";
import i18n from "@/locales";
import TagPopup from "@/components/TagPopup.vue";
import { useSubsStore } from "@/store/subs";

describe("TagPopup", () => {
  it("collects, filters, adds, selects, and emits tags when closed", async () => {
    setActivePinia(createPinia());
    const store = useSubsStore();
    store.subs = [{ name: "source", source: "local", process: [], tag: ["alpha", "beta"] }];
    const wrapper = mount(TagPopup, { props: { visible: true }, global: { plugins: [i18n] } });
    const searchInput = wrapper.get("input.t-input__inner");
    await searchInput.setValue("alpha");
    await searchInput.setValue("");
    await wrapper.get("button").trigger("click");
    const addInput = wrapper.findAll("input.t-input__inner")[1];
    await addInput.setValue("gamma");
    await addInput.trigger("blur");
    await wrapper.get(".tag-item").trigger("click");
    await wrapper.vm.close();
    expect(wrapper.emitted("setTag")?.[0]).toEqual(["alpha,gamma"]);
  });
});
