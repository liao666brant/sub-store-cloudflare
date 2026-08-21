<template>
  <div class="editor-action-card action-radio-card">
    <TDialog
      v-model:visible="resolveInfoVisible"
      :header="t(`editorPage.subConfig.nodeActions['${type}'].ip4pTitle`)"
      :body="t(`editorPage.subConfig.nodeActions['${type}'].ip4pContent`)"
      :cancel-btn="t('editorPage.subConfig.pop.clickTag.cancel')"
      :confirm-btn="t(`editorPage.subConfig.nodeActions['${type}'].ip4pOk`)"
      @confirm="visitResolveTypeHelp"
    />
    <p class="des-label">
      {{ $t(`editorPage.subConfig.nodeActions['${type}'].des`) }}
    </p>
    <TRadioGroup v-model="value" class="option-grid">
      <TRadio
        v-for="(provider, index) in providers"
        :key="provider"
        :value="provider"
      >
        <TInput
          v-if="isCustomProvider(provider)"
          v-model="rdoUrl"
          class="compact-input"
          :placeholder="
            $t(
              `editorPage.subConfig.nodeActions['${type}'].customDohPlaceholder`,
            )
          "
        />
        <span v-else>{{
          $t(`editorPage.subConfig.nodeActions['${type}'].options[${index}]`)
        }}</span>
      </TRadio>
    </TRadioGroup>
    <template v-if="isResolveDomain && rdoNewVersion">
      <div class="radio-section">
        <p class="des-label">
          {{ $t(`editorPage.subConfig.nodeActions['${type}'].edns`) }}
        </p>
        <TInput
          v-model="rdoEdns"
          class="compact-input"
          :placeholder="
            $t(`editorPage.subConfig.nodeActions['${type}'].ednsPlaceholder`)
          "
        />
      </div>
      <div class="radio-section radio-section--inline">
        <p class="des-label">
          {{ $t(`editorPage.subConfig.nodeActions['${type}'].concurrency`) }}
        </p>
        <TInput
          v-model="rdoConcurrency"
          class="compact-input"
          type="number"
          :placeholder="
            $t(
              `editorPage.subConfig.nodeActions['${type}'].concurrencyPlaceholder`,
            )
          "
        />
      </div>
      <div class="radio-section">
        <TButton variant="text" size="small" @click="openResolveTypeHelp"
          >{{ $t(`editorPage.subConfig.nodeActions['${type}'].resolveType`)
          }}<HelpCircleIcon size="16"
        /></TButton>
        <TRadioGroup v-model="rdoType" class="option-grid"
          ><TRadio
            v-for="(resolveType, index) in resolveTypes"
            :key="resolveType"
            :value="resolveType"
            >{{
              $t(`editorPage.subConfig.nodeActions['${type}'].types[${index}]`)
            }}</TRadio
          ></TRadioGroup
        >
      </div>
      <div class="radio-section">
        <p class="des-label">
          {{ $t(`editorPage.subConfig.nodeActions['${type}'].filterResult`) }}
        </p>
        <TRadioGroup v-model="rdoFilter" class="option-grid"
          ><TRadio
            v-for="(filter, index) in resolveFilters"
            :key="filter"
            :value="filter"
            >{{
              $t(
                `editorPage.subConfig.nodeActions['${type}'].filters[${index}]`,
              )
            }}</TRadio
          ></TRadioGroup
        >
      </div>
    </template>
    <template v-if="isFlagOperator && foNewVersion && value === 'add'">
      <div class="radio-section">
        <TButton
          class="flag-disclaimer"
          variant="text"
          size="small"
          @click="showTwTips"
          ><span>{{
            $t(`editorPage.subConfig.nodeActions['${type}'].twWhenPrefix`)
          }}</span
          ><img :src="tw" alt="" /><span>{{
            $t(`editorPage.subConfig.nodeActions['${type}'].twWhenSuffix`)
          }}</span
          ><HelpCircleIcon size="16"
        /></TButton>
        <TRadioGroup v-model="foTw" class="option-grid"
          ><TRadio
            v-for="(option, index) in flagOptions"
            :key="option"
            :value="option"
            >{{
              $t(
                `editorPage.subConfig.nodeActions['${type}'].twOptions[${index}]`,
              )
            }}</TRadio
          ></TRadioGroup
        >
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { HelpCircleIcon } from "tdesign-icons-vue-next";
import { inject, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import tw from "@/assets/icons/tw.png";
import { showNotify } from "@/plugin/tdesign";

type ResolveArgs = {
  provider?: string;
  type?: string;
  filter?: string;
  cache?: string;
  url?: string;
  edns?: string;
  concurrency?: string | number;
};
const props = defineProps<{ type: string; id: string }>();
const { t } = useI18n();
const form = inject<Sub | Collection>("form");
const providers = ["Google", "Cloudflare", "Ali", "Tencent", "Custom"] as const;
const flagOptions = ["cn", "ws", "tw"] as const;
const resolveTypes = ["IPv4", "IPv6"] as const;
const resolveFilters = [
  "disabled",
  "removeFailed",
  "IPOnly",
  "IPv4Only",
  "IPv6Only",
] as const;
const value = ref("");
const foTw = ref("cn");
const rdoType = ref("IPv4");
const rdoFilter = ref("disabled");
const rdoCache = ref("disabled");
const rdoUrl = ref("");
const rdoEdns = ref("");
const rdoConcurrency = ref("");
const rdoNewVersion = ref(true);
const foNewVersion = ref(true);
const resolveInfoVisible = ref(false);
const isResolveDomain = props.type === "Resolve Domain Operator";
const isFlagOperator = props.type === "Flag Operator";
const findAction = () => form?.process.find((item) => item.id === props.id);
const isCustomProvider = (provider: string): boolean =>
  isResolveDomain && value.value === "Custom" && provider === "Custom";
const normalizeProvider = (provider: unknown): string =>
  typeof provider === "string" &&
  providers.includes(provider as (typeof providers)[number])
    ? provider
    : "Cloudflare";
const normalizeConcurrency = (): string | undefined =>
  rdoConcurrency.value.trim() || undefined;
const showTwTips = (): void =>
  showNotify({
    title: t("editorPage.subConfig.nodeActions['Flag Operator'].disclaimer"),
    type: "primary",
  });
const openResolveTypeHelp = (): void => {
  resolveInfoVisible.value = true;
};
const visitResolveTypeHelp = (): void => {
  resolveInfoVisible.value = false;
  window.open(
    "https://github.com/heiher/natmap/wiki/faq#%E5%9F%9F%E5%90%8D%E8%AE%BF%E9%97%AE%E6%98%AF%E5%A6%82%E4%BD%95%E5%AE%9E%E7%8E%B0%E7%9A%84",
    "_blank",
    "noopener",
  );
};
const syncAction = (): void => {
  const action = findAction();
  if (!action) return;
  if (isFlagOperator) action.args = { mode: value.value, tw: foTw.value };
  if (props.type === "Sort Operator") action.args = value.value;
  if (isResolveDomain)
    action.args = {
      provider: value.value,
      type: rdoType.value,
      filter: rdoFilter.value,
      cache: rdoCache.value,
      url: rdoUrl.value,
      edns: rdoEdns.value,
      concurrency: normalizeConcurrency(),
    };
};
onMounted(() => {
  const action = findAction();
  if (!action) return;
  if (isFlagOperator) {
    const args = action.args as { mode?: string; tw?: string } | undefined;
    value.value = args?.mode ?? "add";
    foTw.value = args?.tw ?? "cn";
  } else if (props.type === "Sort Operator")
    value.value = typeof action.args === "string" ? action.args : "asc";
  else if (isResolveDomain) {
    const args = (action.args ?? {}) as ResolveArgs;
    value.value = normalizeProvider(args.provider ?? "Google");
    rdoType.value = args.type === "IP4P" ? "IPv6" : (args.type ?? "IPv4");
    rdoFilter.value = args.filter ?? "disabled";
    rdoCache.value = args.cache ?? "enabled";
    rdoUrl.value = args.url ?? "";
    rdoEdns.value = args.edns ?? "";
    rdoConcurrency.value = `${args.concurrency ?? ""}`.trim();
  }
});
watch(
  [value, foTw, rdoType, rdoFilter, rdoCache, rdoUrl, rdoEdns, rdoConcurrency],
  syncAction,
);
</script>

<style src="./ActionRadio.scss" lang="scss" scoped />
