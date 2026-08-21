<template>
  <main class="subscriptions-page">
    <AddSubscriptionDrawer
      v-model:visible="addSubVisible"
      v-model:tips-visible="showImportTips"
      :restore-is-loading="restoreIsLoading"
      @import="importFile"
    />
    <div v-if="hasSubs || hasCollections" class="page-actions">
      <TButton
        v-if="appearanceSetting.showFloatingRefreshButton"
        shape="circle"
        variant="outline"
        :aria-label="t('subPage.loadFailed.btn')"
        @click="refresh"
      >
        <template #icon><RefreshIcon /></template>
      </TButton>
      <TButton
        v-if="appearanceSetting.showFloatingAddButton"
        shape="circle"
        theme="primary"
        :aria-label="t('subPage.addSubTitle')"
        @click="addSubVisible = true"
      >
        <template #icon><AddIcon /></template>
      </TButton>
    </div>

    <section v-if="hasSubs || hasCollections" class="subs-list-wrapper">
      <nav
        v-if="tags.length"
        ref="tagBarRef"
        class="tag-bar"
        :aria-label="t('specificWord.all')"
      >
        <TButton
          v-for="item in tags"
          :key="item.value"
          size="small"
          :theme="item.value === tag ? 'primary' : 'default'"
          :variant="item.value === tag ? 'base' : 'text'"
          @click="setTag(item.value)"
        >
          {{ item.label }}
        </TButton>
      </nav>
      <div class="subs-list-container" :style="{ paddingTop: `${tagBarHeight}px` }">
        <SubscriptionListSection
          v-model:items="filteredSubs"
          kind="sub"
          :is-dual-column="isDualColumnMode"
          :is-folded="isFold('sub')"
          :dragging="dragging"
          @toggle="toggleFold('sub')"
          @sort="changeSort('subs', subs)"
          @start="startDrag(subs)"
          @end="endDrag(subs)"
        />
        <SubscriptionListSection
          v-model:items="filteredCollections"
          kind="collection"
          :is-dual-column="isDualColumnMode"
          :is-folded="isFold('collection')"
          :dragging="dragging"
          @toggle="toggleFold('collection')"
          @sort="changeSort('collections', collections)"
          @start="startDrag(collections)"
          @end="endDrag(collections)"
        />
      </div>
    </section>

    <section
      v-else-if="!isLoading && fetchResult"
      class="empty-state-wrapper"
    >
      <TEmpty :description="t('subPage.onboarding.desc')">
        <template #image>
          <img class="empty-state-image" :src="logoRedIcon" alt="" />
        </template>
        <template #default>
          <h1>{{ t('subPage.onboarding.title') }}</h1>
          <p>{{ t('subPage.onboarding.desc') }}</p>
          <RouterLink to="/edit/subs/UNTITLED">
            <TButton theme="primary">
              {{ t('subPage.onboarding.createSource') }}
            </TButton>
          </RouterLink>
        </template>
      </TEmpty>
    </section>

    <section v-else-if="!isLoading" class="empty-state-wrapper">
      <TEmpty :description="t('subPage.loadFailed.desc')" />
      <form class="load-failed-form" @submit.prevent="saveTokenAndRetry">
        <label for="admin-token">
          {{ t('subPage.loadFailed.tokenLabel') }}
        </label>
        <TInput
          id="admin-token"
          v-model="adminToken"
          type="password"
          :placeholder="t('subPage.loadFailed.tokenPlaceholder')"
        />
        <TButton type="submit" theme="primary" :disabled="!adminToken.trim()">
          {{ t('subPage.loadFailed.saveAndRetry') }}
        </TButton>
      </form>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { AddIcon, RefreshIcon } from "tdesign-icons-vue-next";
import {
  Button as TButton,
  Empty as TEmpty,
  Input as TInput,
} from "tdesign-vue-next";
import logoRedIcon from "@/assets/icons/logo-red.png";
import AddSubscriptionDrawer from "@/components/AddSubscriptionDrawer.vue";
import SubscriptionListSection from "@/components/SubscriptionListSection.vue";
import { useSubscriptionsPage } from "@/hooks/useSubscriptionsPage";

const {
  addSubVisible,
  adminToken,
  appearanceSetting,
  changeSort,
  collections,
  dragging,
  endDrag,
  fetchResult,
  filteredCollections,
  filteredSubs,
  hasCollections,
  hasSubs,
  importFile,
  isDualColumnMode,
  isFold,
  isLoading,
  refresh,
  restoreIsLoading,
  saveTokenAndRetry,
  setTag,
  showImportTips,
  startDrag,
  subs,
  t,
  tag,
  tagBarHeight,
  tagBarRef,
  tags,
  toggleFold,
} = useSubscriptionsPage();
</script>

<style scoped lang="scss">
.subscriptions-page {
  --subscriptions-inline-safe: var(--app-space-inline-safe, 16px);

  min-inline-size: 0;
  color: var(--td-text-color-primary);
}

.page-actions {
  position: fixed;
  z-index: 20;
  right: var(--subscriptions-inline-safe);
  bottom: calc(24px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tag-bar {
  position: fixed;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  width: min(100%, 900px);
  gap: 6px;
  padding: 12px 16px;
  background: var(--td-bg-color-container);
  border-bottom: 1px solid var(--td-component-stroke);
}

.subs-list-container {
  width: min(100%, 900px);
  margin-inline: auto;
}

.empty-state-wrapper {
  display: grid;
  place-items: center;
  gap: 12px;
  padding: 24px 16px;
  text-align: center;
}

.empty-state-image {
  width: 96px;
  height: 96px;
}

.load-failed-form {
  display: grid;
  width: min(100%, 420px);
  gap: 12px;
  text-align: left;
}

@media (max-width: 767px) {
  .page-actions {
    bottom: calc(72px + env(safe-area-inset-bottom));
  }
}
</style>
