import { createPopper, Instance, Placement, placements } from '@popperjs/core';
import { DirectiveBinding } from 'vue';

const createPopperElement = () => {
  const popperElement = document.createElement('div');
  popperElement.classList.add('popper');

  const popperArrow = document.createElement('div');
  popperArrow.classList.add('popper-arrow');
  popperArrow.setAttribute('data-popper-arrow', 'true');
  popperElement.appendChild(popperArrow);

  const popperContent = document.createElement('div');
  popperContent.classList.add('popper-content');

  popperElement.appendChild(popperContent);

  const parentElement =
    document.getElementById('tooltips-container') || document.body;

  parentElement.appendChild(popperElement);

  return popperElement;
};

const modifiersClasses = {
  default: 'color-default',
  primary: 'color-primary',
  success: 'color-success',
  warning: 'color-warning',
  error: 'color-danger',
  sm: 'size-sm',
  md: 'size-md',
  lg: 'size-lg',
  xl: 'size-xl'
};

type ValidModifier = keyof typeof modifiersClasses;

const _popperElements: Record<string, HTMLDivElement> = {};

const usePopperElement = (
  modifiers: Record<string, boolean>
): HTMLDivElement => {
  const modifiersString = JSON.stringify(modifiers);

  if (modifiersString in _popperElements) {
    return _popperElements[modifiersString];
  }

  const popperElement = createPopperElement();

  _popperElements[modifiersString] = popperElement;

  for (const modifier in modifiers) {
    if (modifier in modifiersClasses) {
      popperElement.classList.add(modifiersClasses[modifier as ValidModifier]);
    } else {
      console.warn(`Unknown tooltip modifier: ${modifier}`);
    }
  }

  return popperElement;
};

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.directive('tooltip', {
    mounted(el: HTMLElement, binding: DirectiveBinding<string>) {
      if (!binding.value) {
        return;
      }

      // creates a popper element with the modifiers as key to reuse it

      const popperElement = usePopperElement(binding.modifiers);

      const placement: Placement = (placements as string[]).includes(
        binding.arg || ''
      )
        ? (binding.arg as Placement)
        : 'bottom';

      let offsetValue = 7;

      for (const modifier in binding.modifiers) {
        switch (modifier) {
          case 'sm':
            offsetValue = 7;
            break;
          case 'md':
            offsetValue = 8;
            break;
          case 'lg':
            offsetValue = 9;
            break;
          case 'xl':
            offsetValue = 10;
            break;
        }
      }

      el.setAttribute('data-tooltip', binding.value);

      let instance: Instance | null = null;

      el.addEventListener('mouseenter', () => {
        if (!instance) {
          instance = createPopper(el, popperElement, {
            placement,
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: [0, offsetValue]
                }
              }
            ]
          });
        }
        const tooltipText = el.getAttribute('data-tooltip');
        popperElement.childNodes[1].textContent = tooltipText;
        popperElement.classList.add('popper-show');
        instance.update();
      });

      el.addEventListener('mouseleave', () => {
        popperElement.classList.remove('popper-show');
      });
    },
    updated(el: HTMLElement, binding: DirectiveBinding<string>) {
      el.setAttribute('data-tooltip', binding.value);
    }
  });
});
