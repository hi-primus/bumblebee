import { ConfirmationPopup } from '@/types/app';

let popupId = 1;

const popups = ref<Array<ConfirmationPopup>>([]);

const DEFAULT_POPUP: Partial<ConfirmationPopup> = {
  title: '',
  message: '',
  acceptLabel: 'Accept',
  cancelLabel: 'Cancel'
};

const confirm = async (
  popupInput: Partial<ConfirmationPopup> | string = {}
): Promise<boolean> => {
  let popup: Partial<ConfirmationPopup>;

  if (typeof popupInput === 'string' || Array.isArray(popupInput)) {
    popup = { message: popupInput } as Partial<ConfirmationPopup>;
  } else {
    popup = popupInput;
  }

  if (Array.isArray(popup.message)) {
    popup.message = popup.message.join('\n');
  }

  const id = popupId;
  popupId++;

  const result: boolean = await new Promise(resolve => {
    const newConfirmationPopup = Object.assign(
      {
        id,
        accept: () => resolve(true),
        cancel: () => resolve(false)
      },
      DEFAULT_POPUP,
      popup
    ) as ConfirmationPopup;
    popups.value.push(newConfirmationPopup);
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
