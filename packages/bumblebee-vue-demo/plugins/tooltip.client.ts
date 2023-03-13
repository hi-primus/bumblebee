import { createPopper, Placement, placements } from '@popperjs/core';
import { DirectiveBinding } from 'vue';

const createPopperElement = (value: string) => {
  const popperElement = document.createElement('div');
  popperElement.classList.add('popper');

  const popperArrow = document.createElement('div');
  popperArrow.classList.add('popper-arrow');
  popperArrow.setAttribute('data-popper-arrow', 'true');
  popperElement.appendChild(popperArrow);

  const popperContent = document.createElement('div');
  popperContent.classList.add('popper-content');
  popperContent.textContent = value;
  popperElement.appendChild(popperContent);

  document.body.appendChild(popperElement);

  return popperElement;
};

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.directive('tooltip', {
    mounted(el: HTMLElement, binding: DirectiveBinding<string>) {
      const popperElement = createPopperElement(binding.value);

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

      popperElement.style.display = 'none';

      el.addEventListener('mouseenter', () => {
        popperElement.style.display = 'block';
        instance.update();
      });

      el.addEventListener('mouseleave', () => {
        popperElement.style.display = 'none';
      });
    }
  });
});
