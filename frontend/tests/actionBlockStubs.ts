export const stubs = {
  TButton: {
    inheritAttrs: false,
    template: "<button v-bind='$attrs'><slot /></button>",
  },
  TCard: { template: "<div><slot /></div>" },
  TDialog: { template: "<div><slot /></div>" },
  TInput: {
    props: ["modelValue"],
    emits: ["update:modelValue"],
    template:
      "<input :value='modelValue' @input=\"$emit('update:modelValue', $event.target.value)\" />",
  },
  TSwitch: {
    props: ["value", "label"],
    emits: ["change"],
    template:
      "<button :aria-label='label[0]' @click=\"$emit('change', !value)\"><slot /></button>",
  },
  TTextarea: { template: "<textarea><slot /></textarea>" },
  TTag: { template: "<span><slot /></span>" },
  TRadio: { template: "<label><slot /></label>" },
  TRadioGroup: { template: "<div><slot /></div>" },
  TCheckbox: { template: "<label><slot /></label>" },
  TCheckboxGroup: { template: "<div><slot /></div>" },
  Draggable: {
    template:
      "<div><slot v-for='(item, index) in (list || modelValue)' :key='item.id' name='item' :element='item' :index='index' /></div>",
    props: ["list", "modelValue"],
  },
};
