// @unocss-include

export const theme: Theme = {
  selector: {
    classes: {
      container: "sm:text-sm md:text-4 relative",
      button: "input-primary w-full min-h-13 py-2 px-5 text-left disabled:op-80",
      buttonOpen: "ring-2 ring-bumblebee-primaryDarker",
      buttonClosed: "",
      buttonIcon: "text-bumblebee-primaryDarker/80",
      buttonIconOpen: "",
      buttonIconClosed: "",
      buttonText: "",
      buttonTextSelected: "",
      buttonTextDefault: "text-bumblebee-text/70",
      option: "",
      optionActive: "bg-bumblebee-primary text-white",
      optionDefault: "text-bumblebee-text",
      optionIcon: "",
      optionIconActive: "text-white",
      optionIconDefault: "text-bumblebee-strong",
      errorContainer: "text-red-500 text-sm block px-1 mt-1",
      errorInput: "border-1 border-red-500",
    },
    icons: {
      option: "",
      optionSelected: "check",
      optionDefault: "",
      button: "",
      buttonOpen: "circle-arrow-up",
      buttonDefault: "circle-arrow-down",
    },
  },
  condensedSelector: {
    classes: {
      button: "input-primary w-full min-h-8 py-2 px-3 text-left disabled:op-80",
    },
  },
  autocomplete: {
    classes: {
      container: "sm:text-sm md:text-4",
      inputContainer: "",
      field: "input-primary w-full min-h-13 py-2 px-5 text-left",
      hiddenField: "input-default",
      fieldOpen: "ring-2 ring-bumblebee-darkPrimary",
      fieldClosed: "",
      fieldIcon: "text-bumblebee-primaryDarker/80",
      fieldIconOpen: "",
      fieldIconClosed: "",
      option: "",
      optionActive: "bg-bumblebee-primary text-white",
      optionDefault: "text-bumblebee-text",
      optionIcon: "",
      optionIconActive: "text-white",
      optionIconDefault: "text-bumblebee-strong",
      errorContainer: "text-red-500 text-sm block px-1 mt-1",
      errorInput: "border-1 border-red-500",
    },
    icons: {
      option: "",
      optionSelected: "check",
      optionDefault: "",
      field: "",
      fieldOpen: "circle-arrow-up",
      fieldDefault: "circle-arrow-down",
    },
  },
  condensedAutocomplete: {
    classes: {
      field: "input-primary w-full min-h-8 py-2 px-3 text-left",
    },
  },
  buttonSelector: {
    classes: {
      button:
        "rounded-lg bg-bumblebee-strong text-white text-sm min-w-24 py-1 px-6 text-center",
      buttonOpen: "ring-2 ring-bumblebee-strong/20",
      optionActive: "bg-bumblebee-strong text-white",
      optionIconDefault: "text-bumblebee-strong",
    },
    icons: {
      button: false,
    },
  },
  checkbox: {
    classes: {
      container: "flex items-center gap-x-2",
      input: "accent-bumblebee-strong disabled-accent-bumblebee-gray h-5 w-5",
      label: "sm:text-sm md:text-4 font-medium",
    },
  },
  smallCheckbox: {
    classes: {
      input: "accent-bumblebee-strong disabled-accent-bumblebee-gray",
    },
  },
  input: {
    classes: {
      container: "sm:text-sm md:text-4",
      field: "input-primary sm:text-sm md:text-4 w-full min-h-13 py-2 px-5",
      errorContainer: "text-red-500 text-sm block px-1 mt-1",
      errorInput: "border-1 border-red-500",
    },
  },
  condensedInput: {
    classes: {
      field: "input-primary sm:text-sm md:text-4 w-full min-h-8 py-2 px-3",
    },
  },
  file: {
    classes: {
      container: "sm:text-sm md:text-4",
      inputContainer: "cursor-pointer position-relative flex items-center gap-2 input-primary w-full min-h-13 py-2 pl-5 pr-10 text-left",
      fieldText: "select-none",
      fieldTextDefault: "text-bumblebee-text/70",
      fieldIcon: "text-bumblebee-primaryDarker/80",
      hiddenField: "position-absolute left-0 top-0 w-full h-full input-default opacity-0",
      errorContainer: "text-red-500 text-sm block px-1 mt-1",
      errorInput: "border-1 border-red-500",
    },
    icons: {
      icon: "paperclip-vertical",
    },
  },
  textareaInput: {
    classes: {
      field: "input-primary sm:text-sm md:text-4 w-full min-h-13 py-4 px-5",
    },
  },
  numericInput: {
    classes: {
      component: "sm:text-sm md:text-4",
      field: "input-primary font-semibold sm:text-sm md:text-4 w-full min-h-13 py-1 px-3",
    },
  },
  amount: {
    classes: {
      component:
        "flex px-3 py-2 items-center justify-between bg-bumblebee-primaryLightest rounded-md w-full min-h-13",
      field:
        "flex font-semibold text-base text-center w-10 text-bumblebee-text tabular-nums items-center justify-center bg-bumblebee-primaryLightest",
      button:
        "flex fill-current text-bumblebee-primaryDarker/80 disabled:text-bumblebee-primaryDarker/40 w-6 items-center text-xl justify-center",
    },
    icons: {
      minus: "minus",
      plus: "plus",
    },
  },
  condensedAmount: {
    classes: {
      component:
        "flex px-3 py-2 items-center justify-between bg-bumblebee-primaryLightest rounded-md w-full min-h-8",
      field:
        "flex font-semibold text-base text-center w-10 text-bumblebee-text tabular-nums items-center justify-center bg-bumblebee-primaryLightest h-5",
    },
  },
  deliveryTime: {
    classes: {
      component:
        "max-w-320px text-bumblebee-text var-[active-color]-bumblebee-primary var-[active-text-color]-white var-[header-text-color]-bumblebee-text/80 var-[inactive-text-color]-bumblebee-text/50 sm:text-sm md:text-4",
      field:
        "input-primary w-full min-h-8 py-1 px-3 not-disabled:cursor-pointer disabled:op-80",
      popup:
        "bg-white rounded-lg shadow-lg py-4 px-4 !left-0 z-2 mt-5 ml-2",
      fields:
        "flex flex-col gap-2"
    },
  },
  dateInput: {
    classes: {
      component: `
        text-bumblebee-text
        var-[active-color]-bumblebee-primary
        var-[active-text-color]-white
        var-[header-text-color]-bumblebee-text/80
        var-[inactive-text-color]-bumblebee-text/50
      `,
      container: `
        input-primary
        sm:text-sm md:text-4 w-full min-h-13 py-2 px-5
        flex flex-col justify-center gap-2 position-relative
      `,
      field:
        "input-default bg-transparent w-full",
      label: "ml-2 sm:text-sm md:text-4 font-medium",
      popup:
        "bg-white rounded-lg shadow-lg pt-4 pb-2 px-2 !left-0 z-2 mt-5 ml-2",
      calendarIcon: "text-bumblebee-primaryDarker/80 mr--3 min-w-3 cursor-pointer"
    },
    icons: {
      calendar: "calendar"
    }
  },
  button: {
    defaultColors: `
      var-[button-text-color]-white
      var-[button-color]-bumblebee-primaryDarker
      var-[button-light-color]-bumblebee-primary
      var-[button-lighter-color]-bumblebee-primaryLight
    `,
    classes: {
      button: `
        text-[var(--button-text-color)]
        bg-[var(--button-color)]
        hover:bg-[var(--button-light-color)]
        outline-[var(--button-lighter-color)]
      `,
      buttonSize: "button-default",
    },
    icons: {
      spinner: "loader",
    },
  },
  mediumButton: {
    classes: {
      buttonSize: "button-base text-4 font-800 gap-2 py-2 px-4",
    },
  },
  smallButton: {
    classes: {
      buttonSize: "button-base text-4 font-600 gap-2 py-2 px-4",
    },
  },
  smallestButton: {
    classes: {
      buttonSize: "button-base text-xs font-600 gap-1 py-1 px-2",
    },
  },
  narrowButton: {
    classes: {
      buttonSize: "button-narrow",
    },
  },
  iconButton: {
    classes: {
      buttonSize: "button-base h-8 w-8 text-6",
    },
  },
  smallIconButton: {
    classes: {
      buttonSize: "button-base h-6 w-6 text-4",
    },
  },
  roundedIconButton: {
    classes: {
      buttonSize: "button-base h-8 w-8 rounded-full",
    },
  },
  lighterButton: {
    colors: `
      var-[button-color]-bumblebee-strong
      var-[button-text-color]-white
      var-[button-light-color]-bumblebee-strongLight
      var-[button-lighter-color]-bumblebee-strongLight/70
    `,
  },
  redButton: {
    colors: `
      var-[button-color]-bumblebee-red
      var-[button-text-color]-white
      var-[button-light-color]-bumblebee-redLight
      var-[button-lighter-color]-bumblebee-redLight/70
    `,
  },
  orangeButton: {
    colors: `
      var-[button-color]-bumblebee-orange
      var-[button-text-color]-white
      var-[button-light-color]-bumblebee-orangeLight
      var-[button-lighter-color]-bumblebee-orangeLight/70
    `,
  },
  defaultButton: {
    colors: `
      var-[button-color]-bumblebee-text
      var-[button-text-color]-white
      var-[button-light-color]-bumblebee-text/70
      var-[button-lighter-color]-bumblebee-text/50
    `,
  },
  outlineButton: {
    classes: {
      button: `
        border-2
        text-[var(--button-color)]
        border-[var(--button-color)]
        bg-[var(--button-text-color)]
        hover:bg-[var(--button-light-color)]
        hover:text-[var(--button-text-color)]
        hover:border-transparent
        outline-[var(--button-lighter-color)]
      `,
    },
  },
  invisibleButton: {
    classes: {
      button: `
        bg-transparent text-[var(--button-color)]
        hover:text-[var(--button-light-color)]
        outline-[var(--button-color)]
      `,
      buttonSize: "button-narrow",
    },
  },
  textButton: {
    classes: {
      button: `
        bg-transparent text-[var(--button-color)]
        hover:text-[var(--button-light-color)]
        outline-[var(--button-lighter-color)]
      `,
      buttonSize: "button-base text-4 font-400 gap-2 py-1 px-2 uppercase",
    },
  },
  tutorialButton: {
    classes: {
      button: `
        border-b-2 border-x-2 border-bumblebee-strong bg-white text-bumblebee-strong
        hover:bg-bumblebee-strong hover:text-white
        outline-bumblebee-strongLight
      `,
      buttonSize:
        "text-4 font-800 uppercase transition-all duration-100 rounded-b-md truncate px-18 py-4",
    },
  },
  toast: {
    classes: {
      container: "bg-bumblebee-strong text-white",
      success: "bg-bumblebee-success text-white",
      info: "bg-bumblebee-strong text-white",
      warn: "bg-bumblebee-warn text-bumblebee-text",
      error: "bg-bumblebee-error text-white",
    },
    icons: {
      toast: "circle-info",
      success: "circle-check",
      info: "circle-info",
      warn: "triangle-exclamation",
      error: "circle-exclamation",
    },
  },
};

export default theme;
