import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import i18n from "@/locales";
import { stubs } from "./actionBlockStubs";

const showNotify = vi.hoisted(() => vi.fn());
vi.mock("@/plugin/tdesign", () => ({ showNotify }));
vi.mock("@/api/app", () => ({
  useCloudflareApi: () => ({
    getScripts: vi.fn().mockResolvedValue({ data: { data: [] } }),
  }),
}));
vi.mock("vue-clipboard3", () => ({
  default: () => ({ toClipboard: vi.fn() }),
}));
vi.mock("@vueuse/core", () => ({
  useClipboard: () => ({ copy: vi.fn(), isSupported: false }),
}));

import ActionBlock from "@/views/editor/ActionBlock.vue";
import ActionRadio from "@/views/editor/components/ActionRadio.vue";
import FilterSelect from "@/views/editor/components/FilterSelect.vue";
import HandleDuplicate from "@/views/editor/components/HandleDuplicate.vue";
import Regex from "@/views/editor/components/Regex.vue";
import ScriptAction from "@/views/editor/components/ScriptAction.vue";

const action = {
  id: "regex-1",
  type: "Regex Filter",
  component: "div",
  customName: "Regex",
  enabled: true,
  args: { keep: true, regex: [] },
  tipsDes: "Regex help",
};
const form = { process: [action] };
describe("editor action modules", () => {
  it("keeps action add, collapse and delete as explicit keyboard-accessible controls", async () => {
    const wrapper = mount(ActionBlock, {
      props: {
        checked: [["regex-1", true]],
        list: [action],
        sourceType: "subs",
      },
      global: { plugins: [i18n], provide: { form }, stubs },
    });

    await wrapper.get('button[aria-label="Collapse actions"]').trigger("click");
    expect(wrapper.get('button[aria-label="Expand actions"]').exists()).toBe(
      true,
    );
    await wrapper.get('button[aria-label="Delete action"]').trigger("click");
    expect(wrapper.vm.deleteVisible).toBe(true);
  });

  it("emits one enable toggle without mutating the action before its parent handles it", async () => {
    const toggleAction = { ...action, id: "toggle-1", enabled: true };
    const toggleForm = { process: [toggleAction] };
    const wrapper = mount(ActionBlock, {
      props: {
        checked: [[toggleAction.id, true]],
        list: [toggleAction],
        sourceType: "subs",
      },
      global: { plugins: [i18n], provide: { form: toggleForm }, stubs },
    });

    await wrapper.get('button[aria-label="Enable"]').trigger("click");

    expect(toggleAction.enabled).toBe(true);
    expect(wrapper.emitted("toggleAction")).toEqual([[toggleAction.id]]);
  });

  it("renders the unavailable state when a script action has no editor form provider", async () => {
    const wrapper = mount(ScriptAction, {
      props: { id: "script-without-form" },
      global: { plugins: [i18n], stubs },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.find(".script-unavailable").exists()).toBe(true);
  });

  it("rejects an invalid regular expression without mutating the editor action payload", async () => {
    const regexAction = {
      id: "regex-invalid",
      type: "Regex Filter",
      args: { keep: true, regex: [] },
    };
    const regexForm = { process: [regexAction] };
    const wrapper = mount(Regex, {
      props: { id: "regex-invalid", type: "Regex Filter" },
      global: { plugins: [i18n], provide: { form: regexForm }, stubs },
    });
    await wrapper.vm.$nextTick();
    wrapper.vm.input1 = "[";
    wrapper.vm.addItem();
    expect(regexAction.args.regex).toEqual([]);
    expect(showNotify).toHaveBeenCalledOnce();
  });

  it("writes TDesign radio and checkbox edits into the existing action payloads", async () => {
    const resolveAction = {
      id: "resolve-1",
      type: "Resolve Domain Operator",
      args: {
        provider: "Google",
        type: "IPv4",
        filter: "disabled",
        cache: "enabled",
        url: "",
        edns: "",
        concurrency: undefined,
      },
    };
    const filterAction = {
      id: "filter-1",
      type: "Region Filter",
      args: { keep: true, value: ["HK"] },
    };
    const editorForm = { process: [resolveAction, filterAction] };
    const radio = mount(ActionRadio, {
      props: { id: resolveAction.id, type: resolveAction.type },
      global: { plugins: [i18n], provide: { form: editorForm }, stubs },
    });
    const filter = mount(FilterSelect, {
      props: { id: filterAction.id, type: filterAction.type },
      global: { plugins: [i18n], provide: { form: editorForm }, stubs },
    });
    await radio.vm.$nextTick();
    await filter.vm.$nextTick();
    radio.vm.value = "Custom";
    radio.vm.rdoUrl = "https://dns.example/doh";
    radio.vm.rdoConcurrency = "12";
    filter.vm.mode = 1;
    filter.vm.value.push("JP");
    await radio.vm.$nextTick();
    await filter.vm.$nextTick();
    expect(resolveAction.args).toMatchObject({
      provider: "Custom",
      url: "https://dns.example/doh",
      concurrency: "12",
    });
    expect(filterAction.args).toEqual({ keep: false, value: ["HK", "JP"] });
  });

  it("keeps a dirty duplicate edit untouched when its explicit confirmation dialog is cancelled", async () => {
    const duplicateAction = {
      id: "duplicate-1",
      type: "Handle Duplicate Operator",
      args: {
        action: "rename",
        position: "front",
        template: "1",
        link: "-",
        field: ["name", "server"],
      },
    };
    const duplicateForm = { process: [duplicateAction] };
    const wrapper = mount(HandleDuplicate, {
      attachTo: document.querySelector("#app")!,
      props: { id: duplicateAction.id, type: duplicateAction.type },
      global: { plugins: [i18n], provide: { form: duplicateForm }, stubs },
    });
    await wrapper.vm.$nextTick();
    wrapper.vm.input = "unsaved";
    wrapper.vm.requestEdit(1);
    expect(wrapper.vm.editDialogVisible).toBe(true);
    wrapper.vm.cancelEdit();
    await wrapper.vm.$nextTick();
    expect(duplicateAction.args.field).toEqual(["name", "server"]);
    const trigger = wrapper.get('button[aria-label="Edit field 1"]');
    (trigger.element as HTMLButtonElement).focus();
    expect(document.activeElement).toBe(trigger.element);
  });

  it("keeps a dirty regex edit untouched when its confirmation dialog is cancelled", async () => {
    const regexAction = {
      id: "regex-dirty",
      type: "Regex Filter",
      args: { keep: true, regex: ["foo"] },
    };
    const regexForm = { process: [regexAction] };
    const wrapper = mount(Regex, {
      attachTo: document.querySelector("#app")!,
      props: { id: regexAction.id, type: regexAction.type },
      global: { plugins: [i18n], provide: { form: regexForm }, stubs },
    });
    await wrapper.vm.$nextTick();
    wrapper.vm.input1 = "draft";
    wrapper.vm.requestEdit(0);
    wrapper.vm.cancelEdit();
    expect(regexAction.args.regex).toEqual(["foo"]);
    const trigger = wrapper.get('button[aria-label="Edit regex 1"]');
    (trigger.element as HTMLButtonElement).focus();
    expect(document.activeElement).toBe(trigger.element);
  });

  it("closes the dirty-edit confirmation before moving the selected duplicate or regex tag into its input", async () => {
    const duplicateAction = {
      id: "duplicate-confirm",
      type: "Handle Duplicate Operator",
      args: {
        action: "rename",
        position: "front",
        template: "1",
        link: "-",
        field: ["name"],
      },
    };
    const regexAction = {
      id: "regex-confirm",
      type: "Regex Filter",
      args: { keep: true, regex: ["foo"] },
    };
    const editorForm = { process: [duplicateAction, regexAction] };
    const duplicate = mount(HandleDuplicate, {
      props: { id: duplicateAction.id, type: duplicateAction.type },
      global: { plugins: [i18n], provide: { form: editorForm }, stubs },
    });
    const regex = mount(Regex, {
      props: { id: regexAction.id, type: regexAction.type },
      global: { plugins: [i18n], provide: { form: editorForm }, stubs },
    });
    await duplicate.vm.$nextTick();
    await regex.vm.$nextTick();
    duplicate.vm.input = "draft";
    duplicate.vm.requestEdit(0);
    duplicate.vm.confirmEdit();
    regex.vm.input1 = "draft";
    regex.vm.requestEdit(0);
    regex.vm.confirmEdit();
    expect(duplicate.vm.editDialogVisible).toBe(false);
    expect(duplicate.vm.input).toBe("name");
    expect(duplicateAction.args.field).toEqual([]);
    expect(regex.vm.editDialogVisible).toBe(false);
    expect(regex.vm.input1).toBe("foo");
    expect(regexAction.args.regex).toEqual([]);
  });
});
