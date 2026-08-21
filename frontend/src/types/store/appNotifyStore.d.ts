interface AppNotifyStoreState {
  navBartop?: number;
}

type NotifySettings = {
  title: string;
  content?: string;
  type?: 'primary' | 'success' | 'danger' | 'warning';
  duration?: number;
  navBartop?: number;
  offset?: readonly [number, number];
  placement?: 'top' | 'bottom';
};
