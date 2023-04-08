import {
  createPopper,
  Instance,
  Placement,
  placements,
  VirtualElement
} from '@popperjs/core';
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

interface PopperElement extends HTMLDivElement {
  referenceElement?: HTMLElement;
}

interface HTMLElementWithTooltip extends HTMLElement {
  update: () => void;
  popperElement: PopperElement;
}

const _popperElements: Record<string, PopperElement> = {};

const usePopperElement = (
  modifiers: Record<string, boolean>
): PopperElement => {
  const modifiersString = JSON.stringify(modifiers);

  if (modifiersString in _popperElements) {
    return _popperElements[modifiersString];
  }

  const popperElement = createPopperElement();

  _popperElements[modifiersString] = popperElement as PopperElement;

  for (const modifier in modifiers) {
    if (modifier in modifiersClasses) {
      popperElement.classList.add(modifiersClasses[modifier as ValidModifier]);
    } else if (modifier !== 'follow') {
      console.warn(`Unknown tooltip modifier: ${modifier}`);
    }
  }

  return popperElement;
};

function generateGetBoundingClientRect(x = 0, y = 0) {
  return () =>
    ({
      width: 0,
      height: 0,
      top: y,
      right: x,
      bottom: y,
      left: x
    } as DOMRect);
}

const virtualElement: VirtualElement = {
  getBoundingClientRect: generateGetBoundingClientRect()
};

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.directive('tooltip', {
    mounted(originalElement: HTMLElement, binding: DirectiveBinding<string>) {
      const el = originalElement as HTMLElementWithTooltip;

      // creates a popper element with the modifiers as key to reuse it

      const popperElement = usePopperElement(binding.modifiers);

      const placement: Placement = (placements as string[]).includes(
        binding.arg || ''
      )
        ? (binding.arg as Placement)
        : 'bottom';

      const follow = binding.modifiers.follow
        ? 'both'
        : binding.modifiers['follow-x']
        ? 'x'
        : binding.modifiers['follow-y']
        ? 'y'
        : false;

      let offsetValue = +(el.getAttribute('data-tooltip-offset') || 0);

      if (!offsetValue) {
        for (const modifier in binding.modifiers) {
          switch (modifier) {
            case 'sm':
              offsetValue = 4;
              break;
            case 'md':
              offsetValue = 6;
              break;
            case 'lg':
              offsetValue = 8;
              break;
            case 'xl':
              offsetValue = 9;
              break;
          }
        }
        if (!offsetValue) {
          offsetValue = 4;
        }
      }

      const tooltipText =
        binding.value || el.getAttribute('data-tooltip') || '';

      el.setAttribute('data-tooltip', tooltipText);

      let instance: Instance | null = null;

      el.popperElement = popperElement;

      el.update = () => {
        const tooltipText = el.getAttribute('data-tooltip');
        if (popperElement.referenceElement === el) {
          popperElement.childNodes[1].textContent = tooltipText;
          popperElement.classList.add('popper-show');
          instance?.update();
        }
      };

      el.addEventListener('mouseenter', async () => {
        await new Promise(resolve => setTimeout(resolve, 1));
        if (!instance) {
          instance = createPopper(follow ? virtualElement : el, popperElement, {
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
        popperElement.referenceElement = el;
        el.update();
      });

      if (follow) {
        el.addEventListener('mousemove', (event: MouseEvent) => {
          const { clientX: x, clientY: y } = event;
          const element = event.target as HTMLElement | null;
          if (follow !== 'both' && element) {
            const rect = element.getBoundingClientRect();
            if (follow === 'x') {
              virtualElement.getBoundingClientRect = () =>
                ({
                  width: 0,
                  height: rect.height,
                  top: rect.top,
                  right: x,
                  bottom: rect.bottom,
                  left: x
                } as DOMRect);
            } else {
              virtualElement.getBoundingClientRect = () =>
                ({
                  width: rect.width,
                  height: 0,
                  top: y,
                  right: rect.right,
                  bottom: y,
                  left: rect.left
                } as DOMRect);
            }
          } else {
            virtualElement.getBoundingClientRect =
              generateGetBoundingClientRect(x, y);
          }
          instance?.update();
        });
      }

      el.addEventListener('mouseleave', () => {
        if (popperElement.referenceElement === el) {
          popperElement.referenceElement = undefined;
        }
        popperElement.classList.remove('popper-show');
      });
    },
    updated(el: HTMLElement, binding: DirectiveBinding<string>) {
      const { update, popperElement } = el as HTMLElementWithTooltip;
      const active = popperElement.referenceElement === el;
      if (binding.value) {
        el.setAttribute('data-tooltip', binding.value);
      }
      if (active && update) {
        update();
      }
    },
    unmounted(el: HTMLElement) {
      const { popperElement } = el as HTMLElementWithTooltip;
      if (popperElement.referenceElement === el) {
        popperElement.referenceElement = undefined;
        popperElement.classList.remove('popper-show');
      }
    }
  });
});
