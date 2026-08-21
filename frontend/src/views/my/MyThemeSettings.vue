<template>
  <TCard class="settings-card" :title="t('myPage.theme.title')">
    <TForm :data="themeForm" layout="vertical" class="theme-form">
      <TFormItem :label="t('myPage.theme.mode')">
        <TRadioGroup v-model="themeMode">
          <TRadioButton value="auto">{{ t("myPage.theme.auto") }}</TRadioButton>
          <TRadioButton value="manual">{{ t("myPage.theme.manual") }}</TRadioButton>
        </TRadioGroup>
      </TFormItem>
      <TFormItem v-if="themeForm.auto" :label="t('myPage.theme.light')">
        <TSelect v-model="themeForm.light" :options="lightThemeOptions" />
      </TFormItem>
      <TFormItem v-if="themeForm.auto" :label="t('myPage.theme.dark')">
        <TSelect v-model="themeForm.dark" :options="darkThemeOptions" />
      </TFormItem>
      <TFormItem v-else :label="t('myPage.theme.theme')">
        <TSelect v-model="themeForm.name" :options="themeOptions" />
      </TFormItem>
    </TForm>
    <div class="theme-actions">
      <TButton size="small" theme="primary" :loading="themeSaving" @click="saveTheme">
        <template #icon><SaveIcon /></template>
        {{ t("myPage.btn.save") }}
      </TButton>
    </div>
  </TCard>
</template>

<script lang="ts" setup>
import { SaveIcon } from "tdesign-icons-vue-next";
import { Button as TButton, Card as TCard, Form as TForm, FormItem as TFormItem, RadioButton as TRadioButton, RadioGroup as TRadioGroup, Select as TSelect } from "tdesign-vue-next";
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { getThemePickerOptions } from "@/hooks/useThemes";
import { showNotify } from "@/plugin/tdesign";
import { useSettingsStore } from "@/store/settings";

const settingsStore = useSettingsStore();
const { t } = useI18n();
const themeSaving = ref(false);
const themeForm = reactive<{ auto: boolean; name: CustomTheme; dark: CustomTheme; light: CustomTheme }>({
  auto: true,
  name: "light",
  dark: "dark",
  light: "light",
});
const themeOptions = getThemePickerOptions();
const lightThemeOptions = getThemePickerOptions("light");
const darkThemeOptions = getThemePickerOptions("dark");
const themeMode = computed({
  get: (): "auto" | "manual" => themeForm.auto ? "auto" : "manual",
  set: (value: "auto" | "manual"): void => {
    themeForm.auto = value === "auto";
  },
});

const syncThemeForm = (): void => {
  themeForm.auto = settingsStore.theme.auto;
  themeForm.name = settingsStore.theme.name;
  themeForm.dark = settingsStore.theme.dark;
  themeForm.light = settingsStore.theme.light;
};

const saveTheme = async (): Promise<void> => {
  themeSaving.value = true;
  try {
    await settingsStore.changeTheme({ theme: { ...themeForm } });
  } catch {
    showNotify({ type: "danger", title: t("myPage.notify.save.themeFailed") });
  } finally {
    syncThemeForm();
    themeSaving.value = false;
  }
};

watch(() => settingsStore.theme, syncThemeForm, { deep: true, immediate: true });
</script>

<style lang="scss" scoped>
.settings-card {
  background: var(--td-bg-color-container);
}

.settings-card :deep(.t-card__header) {
  align-items: center;
}

.theme-form {
  margin-block-start: var(--app-space-standard);
}

.theme-actions {
  display: flex;
  justify-content: flex-end;
  margin-block-start: var(--app-space-standard);
}
</style>
