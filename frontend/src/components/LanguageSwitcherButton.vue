<template>
  <div class="language-switcher">
    <TButton
      ref="triggerButton"
      :class="['language-switch-button', 'language-switch-button--' + props.variant]"
      variant="text"
      shape="square"
      aria-haspopup="menu"
      :aria-expanded="isMenuOpen"
      :aria-label="t('navBar.langSwitcher.cellTitle')"
      :title="t('navBar.langSwitcher.cellTitle')"
      @click="toggleMenu"
      @keydown.down.prevent="openMenuFromKeyboard"
      @keydown.esc.stop.prevent="closeMenu"
    >
      <TranslateIcon />
    </TButton>
    <div
      v-if="isMenuOpen"
      class="language-switch-popup"
      role="menu"
      :style="{ zIndex: Number(props.zIndex) }"
      :aria-label="t('navBar.langSwitcher.cellTitle')"
      @keydown.esc.stop.prevent="closeMenu"
    >
      <button
        v-for="(lang, index) in SUPPORTED_LOCALES"
        :key="lang.key"
        :ref="index === 0 ? setFirstMenuItem : undefined"
        type="button"
        class="language-switch-popup__item"
        :class="{ 'language-switch-popup__item--selected': lang.key === currentLocale }"
        role="menuitem"
        @click="changeLang(lang.key)"
        @keydown.enter.prevent="changeLang(lang.key)"
        @keydown.esc.stop.prevent="closeMenu"
      >
        <CheckIcon v-if="lang.key === currentLocale" />
        {{ t(lang.labelKey) }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckIcon, TranslateIcon } from "tdesign-icons-vue-next";
import { Button as TButton } from "tdesign-vue-next";
import { computed, ref, watch, type ComponentPublicInstance } from "vue";
import { useI18n } from "vue-i18n";
import {
  SUPPORTED_LOCALES,
  normalizeLocale,
  type SupportedLocale,
} from "@/locales/languages";

const props = withDefaults(defineProps<{
  variant?: "compact" | "icon";
  zIndex?: number | string;
}>(), {
  variant: "compact",
  zIndex: 12000,
});

const { t, locale } = useI18n();
const isMenuOpen = ref(false);
const triggerButton = ref<InstanceType<typeof TButton> | null>(null);
const firstMenuItem = ref<HTMLButtonElement | null>(null);
const currentLocale = computed(() => normalizeLocale(String(locale.value || "")));

const setFirstMenuItem = (element: Element | ComponentPublicInstance | null): void => {
  firstMenuItem.value = element instanceof HTMLButtonElement ? element : null;
};

const focusTriggerButton = (): void => {
  const element = triggerButton.value?.$el;
  if (element instanceof HTMLButtonElement) element.focus();
};

watch([isMenuOpen, firstMenuItem], ([visible, menuItem]) => {
  if (visible) menuItem?.focus();
}, { flush: "post" });

const openMenuFromKeyboard = (): void => {
  isMenuOpen.value = true;
};

const toggleMenu = (): void => {
  isMenuOpen.value = !isMenuOpen.value;
};

const closeMenu = (): void => {
  isMenuOpen.value = false;
  focusTriggerButton();
};

const changeLang = (value: SupportedLocale): void => {
  locale.value = value;
  localStorage.setItem("locale", value);
  closeMenu();
};
</script>

<style scoped lang="scss">
.language-switch-button {
  color: var(--td-text-color-secondary, var(--second-text-color));
}

.language-switch-button--compact {
  border: 1px solid var(--td-component-stroke, var(--divider-color));
}

.language-switch-button--icon {
  color: var(--td-text-color-secondary, var(--icon-nav-bar-right));
}

.language-switcher {
  position: relative;
}

.language-switch-popup {
  position: absolute;
  inset-block-start: calc(100% + var(--app-space-compact, 6px));
  inset-inline-end: 0;
  min-width: 9rem;
  padding: var(--app-space-compact, 6px);
  background: var(--td-bg-color-container, var(--popup-color));
}

.language-switch-popup__item {
  display: flex;
  align-items: center;
  width: 100%;
  gap: var(--app-space-compact, 6px);
  padding: var(--td-comp-paddingTB-s, 6px) var(--td-comp-paddingLR-s, 8px);
  color: var(--td-text-color-primary, var(--primary-text-color));
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: var(--td-radius-default, 4px);
  cursor: pointer;
}

.language-switch-popup__item:focus-visible {
  outline: 2px solid var(--td-brand-color, var(--primary-color));
  outline-offset: -2px;
}

.language-switch-popup__item--selected {
  color: var(--td-brand-color, var(--primary-color));
}
</style>
