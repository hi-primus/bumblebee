import { PropType } from 'vue'

import defaultTheme from '@/themes/bumblebee'

function getThemeProps(defaultVariant?: Array<string> | string) {
  return {
    theme: {
      type: Object as PropType<Theme>,
      default: () => ({})
    },
    variant: {
      type: [Array, String] as PropType<Array<string> | string>,
      default: defaultVariant
    },
    classes: {
      type: Object,
      default: () => {}
    },
    icons: {
      type: Object,
      default: () => {}
    }
  }
}

function useTheme(theme?: Theme) {
  return computed(() => ({ ...defaultTheme, ...(theme || {}) }))
}

function useThemeStyle(
  theme,
  variant,
  defaultVariant,
  suffix,
  extraClasses = null,
  extraIcons = null,
  callback = null
) {
  return computed(() => {
    let themeItem = theme.value[defaultVariant] || {
      classes: {},
      icons: {},
      colors: ''
    }

    const defaultColors = themeItem.defaultColors || ''

    if (variant) {
      if (typeof variant === 'string') {
        variant = variant.split(' ')
      }

      let variantsArray = [variant].flat()

      if (defaultVariant) {
        variantsArray = [defaultVariant, ...variantsArray]
      }

      const themeItems = variantsArray.map(variant => {
        if (theme.value[variant]) {
          return theme.value[variant]
        }
        if (suffix) {
          const variantName = `${variant}${suffix}`
          if (theme.value[variantName]) {
            return theme.value[variantName]
          }
        }
      })

      const resultThemeItem = { classes: {}, icons: {}, colors: defaultColors }

      themeItems.forEach(themeItem => {
        if (!themeItem) {
          return
        }
        if (themeItem.colors) {
          resultThemeItem.colors = themeItem.colors
        }
        if (themeItem.classes) {
          resultThemeItem.classes = {
            ...resultThemeItem.classes,
            ...themeItem.classes
          }
        }
        if (themeItem.icons) {
          resultThemeItem.icons = {
            ...resultThemeItem.icons,
            ...themeItem.icons
          }
        }
      })

      themeItem = resultThemeItem
    }

    for (const key in extraClasses) {
      themeItem.classes[key] = themeItem.classes[key]
        ? `${themeItem.classes[key]} ${extraClasses[key]}`
        : extraClasses[key]
    }

    for (const key in extraIcons) {
      themeItem.icons[key] = extraIcons[key]
    }

    return callback ? callback(themeItem) : themeItem
  })
}

export { getThemeProps, useTheme, useThemeStyle }
