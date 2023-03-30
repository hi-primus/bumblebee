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

  const result: boolean = await new Promise(resolve => {
    const newConfirmPopup = Object.assign(
      {
        id,
        accept: () => resolve(true),
        cancel: () => resolve(false)
      },
      DEFAULT_POPUP,
      popup
    ) as ConfirmPopup;
    popups.value.push(newConfirmPopup);
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
