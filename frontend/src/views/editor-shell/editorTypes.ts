export type EditorFormInstance = {
  readonly validate: (options?: { readonly fields?: readonly string[] }) => Promise<unknown>;
};

export type EditorFormState = Record<string, unknown> & {
  content?: string;
  displayName: string;
  form: string;
  icon: string;
  ignoreFailedRemoteSub: boolean | "disabled" | "skip";
  isIconColor: boolean;
  name: string;
  passThroughUA: boolean;
  process: Process[];
  remark: string;
  source?: "local" | "remote";
  subscriptions?: string[];
  tag?: string;
  ua?: string;
  url?: string;
};
