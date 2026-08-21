type DialogOptions = { readonly content: string; readonly okText: string; readonly title: string };
type Options = {
  readonly content: () => DialogOptions;
  readonly open: (options: DialogOptions) => void;
  readonly subUserinfo: () => DialogOptions;
  readonly template: () => DialogOptions;
  readonly ua: () => DialogOptions;
  readonly url: () => DialogOptions;
};

export const useEditorHelpDialogs = (options: Options) => {
  const contentTips = (): void => options.open(options.content());
  const subUserinfoTips = (): void => options.open(options.subUserinfo());
  const templateTips = (): void => options.open(options.template());
  const uaTips = (): void => options.open(options.ua());
  const urlTips = (): void => options.open(options.url());
  return { contentTips, subUserinfoTips, templateTips, uaTips, urlTips };
};
