import { useSettingsStore } from '@/store/settings';
import { useEventListener } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { ref, watchEffect } from 'vue';


const mql = window.matchMedia('(prefers-color-scheme: dark)');

const commonVariables = {
  "app-radius-overlay": "8px",
  "app-space-block": "24px",
  "app-space-compact": "6px",
  "app-space-control": "10px",
  "app-space-inline-safe": "16px",
  "app-space-standard": "12px",
  "td-radius-default": "12px",
};

const semanticTokenSources = {
  "app-accent-secondary": "second-color",
  "app-brand-gradient-end": "primary-color-end",
  "app-dialog-color": "dialog-color",
  "app-icon-muted": "unimportant-icon-color",
  "app-image-brightness": "img-brightness",
  "td-bg-color-container": "card-color",
  "td-bg-color-page": "background-color",
  "td-brand-color": "primary-color",
  "td-component-stroke": "divider-color",
  "td-error-color": "danger-color",
  "td-success-color": "succeed-color",
  "td-text-color-disabled": "lowest-text-color",
  "td-text-color-placeholder": "comment-text-color",
  "td-text-color-primary": "primary-text-color",
  "td-text-color-secondary": "second-text-color",
} as const;

type ThemeDefinition = {
  meta: {
    name: string;
    author: string;
    label: 'light' | 'dark';
    extend?: string;
  };
  colors: Record<string, string>;
};

export type ThemeMode = ThemeDefinition['meta']['label'];

const THEME_IDS = [
  "dark",
  "darkblue",
  "light",
  "lightblue",
  "mocha",
  "monokai",
  "pureblack",
  "sereneblues",
] as const satisfies readonly CustomTheme[];

const isCustomTheme = (value: string): value is CustomTheme => {
  return THEME_IDS.some(themeId => themeId === value);
};

// 获取主题文件夹内的主题
const getThemeModules = (): Record<CustomTheme, ThemeDefinition> => {
  const allThemes: Partial<Record<CustomTheme, ThemeDefinition>> = {};
  // 读取主题文件内容
  const modulesFiles = import.meta.glob<{ default: ThemeDefinition }>('@/themes/*.ts', { eager: true });
  const keys = Object.keys(modulesFiles);

  // 初始化为主题表，继承合并
  keys.forEach(path => {
    const paths = path.split('/');
    const modulesName = paths[paths.length - 1].replace('.ts', '');
    if (!isCustomTheme(modulesName)) {
      return;
    }
    allThemes[modulesName] = modulesFiles[path].default;
  });

  for (const themeId of THEME_IDS) {
    if (!allThemes[themeId]) {
      throw new Error(`主题 ${themeId} 不存在`);
    }
  }

  // 初始化 theme 表后开始处理继承关系
  for (const key of THEME_IDS) {
    const current = allThemes[key];
    if (!current) continue;
    const extend = current.meta.extend;
    if (extend) {
      const extendModule = isCustomTheme(extend) ? allThemes[extend] : undefined;
      if (extendModule) {
        // 拷贝一份原有继承和目标主题的 color 对象，解构复制覆盖目标主题颜色, 将通用变量覆盖进去
        current.colors = {
          ...{ ...extendModule.colors },
          ...{ ...current.colors },
        };
      } else {
        console.error(`${extend} 主题不存在`);
      }
    }
  }
  return allThemes as Record<CustomTheme, ThemeDefinition>;
};
const modules = getThemeModules();

export const getThemeMode = (themeName: CustomTheme): ThemeMode => modules[themeName].meta.label;

type ThemePickerOption = {
  readonly label: string;
  readonly value: CustomTheme;
};

export const getThemePickerOptions = (mode?: ThemeMode): ThemePickerOption[] => {
  return THEME_IDS
    .filter(value => mode === undefined || modules[value].meta.label === mode)
    .map(value => ({
      label: `${modules[value].meta.name} - ${modules[value].meta.author}`,
      value,
    }));
};

// 定义修改 root 变量方法
const changeVariables = (newMode: CustomTheme) => {
  const colors = modules[newMode].colors;
  const map: Record<string, string> = { ...colors, ...commonVariables };
  for (const [token, source] of Object.entries(semanticTokenSources)) {
    const value = colors[source];
    if (value) map[token] = value;
  }
  for (const [key, value] of Object.entries(map)) {
    document.documentElement.style.setProperty(`--${key}`, value);
  }

  // 切换浏览器窗口 / 状态栏颜色
  const themeColorMeta = document.getElementById('theme__color');
  themeColorMeta.setAttribute(
    'content',
    colors["status-bar-background-color"] ?? colors["background-color"]
  );
  document.body.style.backgroundColor = colors["background-color"] ?? "";
};

export const useThemes = () => {
  // 读取 store 中的主题配置
  const settingsStore = useSettingsStore();
  const { theme } = storeToRefs(settingsStore);

  // 定义主题 picker list 选项
  const pickerList = ref([]);
  const pickerDarkList = ref([]);
  const pickerLightList = ref([]);

  for (const key in modules) {
    if (modules[key].meta.label === 'dark') {
      pickerDarkList.value.push({
        text: modules[key].meta.name + ' - ' + modules[key].meta.author,
        value: key,
      });
    } else if (modules[key].meta.label === 'light') {
      pickerLightList.value.push({
        text: modules[key].meta.name + ' - ' + modules[key].meta.author,
        value: key,
      });
    }

    pickerList.value.push({
      text: modules[key].meta.name + ' - ' + modules[key].meta.author,
      value: key,
    });
  }

  // 定义自动根据系统设置切换主题方法
  const autoTheme = el => {
    el.matches
      ? changeVariables(theme.value.dark)
      : changeVariables(theme.value.light);
  };

  // 监听 theme 设置变化，切换 theme
  watchEffect(async () => {
    if (theme.value.auto) {
      if (theme.value.dark && theme.value.light) {
        autoTheme(mql);
        useEventListener(mql, 'change', autoTheme);
      }
    } else {
      mql.removeEventListener('change', autoTheme);
      changeVariables(theme.value.name);
    }
  });

  return {
    currentMode: () => theme.value.name,
    pickerList,
    pickerDarkList,
    pickerLightList,
    isAuto: () => theme.value.auto,
  };
};
