import '@/assets/styles/fonts.scss';
import '@/assets/styles/global.scss';
import '@/assets/styles/overwritten_css_var.scss';
import i18n from '@/locales';
import { installTDesignFeedback } from '@/plugin/tdesign';
import '@/plugin/touch'

import 'modern-css-reset/dist/reset.min.css';
import 'tdesign-vue-next/es/style/index.css';
import '@/assets/styles/reduced-motion-fix.scss';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import { syncAdminTokenFromUrl } from '@/utils/adminToken';

import App from './App.vue';

async function initializeApp() {
  syncAdminTokenFromUrl();
  const { default: router } = await import('@/router');

  const pinia = createPinia();
  const app = createApp(App);

  installTDesignFeedback(app);
  app.use(router);
  app.use(pinia);
  app.use(i18n);
  app.mount('#app');
}

void initializeApp();
