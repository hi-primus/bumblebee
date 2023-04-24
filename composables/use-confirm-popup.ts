import { ConfirmPopup } from '@/types/app';

let popupId = 1;

const popups = ref<Array<ConfirmPopup>>([]);

const DEFAULT_POPUP: Partial<ConfirmPopup> = {
  title: '',
  message: '',
  acceptLabel: 'Accept',
  cancelLabel: 'Cancel'
};

const confirm = async (
  popupInput: Partial<ConfirmPopup> | string = {}
): Promise<boolean> => {
  let popup: Partial<ConfirmPopup>;

  if (typeof popupInput === 'string' || Array.isArray(popupInput)) {
    popup = { message: popupInput } as Partial<ConfirmPopup>;
  } else {
    popup = popupInput;
  }

  if (Array.isArray(popup.message)) {
    popup.message = popup.message.join('\n');
  }

  const id = popupId;
  popupId++;

  // eslint-disable-next-line no-async-promise-executor
  const result: boolean = await new Promise(async (resolve, reject) => {
    const newConfirmPopup = Object.assign(
      {
        id,
        accept: () => resolve(true),
        cancel: () => resolve(false)
      },
      DEFAULT_POPUP,
      popup
    ) as ConfirmPopup;
    try {
      popups.value.push(newConfirmPopup);
      await new Promise(resolve => setTimeout(resolve, 100));
      const popupElement = document.getElementById(`confirm-popup-${id}`);
      if (popupElement) {
        const acceptButton: HTMLElement | null =
          popupElement.querySelector('.accept-button');
        if (acceptButton) {
          acceptButton.focus();
        }
      }
    } catch (err) {
      reject(err);
    }
  });

  popups.value = popups.value.filter(popup => popup.id !== id);

  return result;
};

export default function () {
  return {
    confirm,
    popups
  };
}
