import { createPopper, Placement, placements } from '@popperjs/core';
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
          case 'default':
            popperElement.classList.add('popper-color-default');
            break;
          case 'primary':
            popperElement.classList.add('popper-color-primary');
            break;
          case 'success':
            popperElement.classList.add('popper-color-success');
            break;
          case 'warning':
            popperElement.classList.add('popper-color-warn');
            break;
          case 'error':
            popperElement.classList.add('popper-color-error');
            break;
          case 'sm':
            offsetValue = 7;
            popperElement.classList.add('popper-size-sm');
            break;
          case 'md':
            offsetValue = 8;
            popperElement.classList.add('popper-size-md');
            break;
          case 'lg':
            offsetValue = 9;
            popperElement.classList.add('popper-size-lg');
            break;
          case 'xl':
            offsetValue = 10;
            popperElement.classList.add('popper-size-xl');
            break;
          default:
            console.warn('Unknown popper modifier: ' + modifier);
        }
      }

      const instance = createPopper(el, popperElement, {
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

      el.addEventListener('mouseenter', () => {
        popperElement.childNodes[1].textContent = binding.value;
        popperElement.classList.add('popper-show');
        instance.update();
      });

      el.addEventListener('mouseleave', () => {
        popperElement.classList.remove('popper-show');
      });
    }
  });
});
