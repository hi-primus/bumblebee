import { ConfirmPopup } from '@/types/app';

let popupId = 1;

const popups = ref<Array<ConfirmPopup>>([]);

const DEFAULT_POPUP: Partial<ConfirmPopup> = {
  title: '',
  message: '',
  acceptLabel: 'Accept',
  cancelLabel: 'Cancel'
};

type DefaultReturnType = boolean | Record<string, string | number | boolean>;

const confirm = async <T extends DefaultReturnType = DefaultReturnType>(
  popupInput: Partial<ConfirmPopup> | string = {}
): Promise<T | boolean> => {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: T | boolean =
    // eslint-disable-next-line no-async-promise-executor
    await new Promise(async (resolve, reject) => {
      const newConfirmPopup = Object.assign(
        {
          id,
          accept: (e: Event) => {
            const data = new FormData(
              (e as SubmitEvent).target as HTMLFormElement
            );
            // filter out empty keys and [text] keys (which are used for labels) and rename [value] keys
            const entries = [...(data?.entries?.() || [])]
              .filter(([key]) => key !== '' && !key.includes('[text]'))
              .map(([key, value]) => {
                if (key.includes('[value]')) {
                  return [key.replace('[value]', ''), value];
                }
                return [key, value];
              });
            if (entries.length) {
              return resolve(Object.fromEntries(entries) as T);
            } else {
              resolve(true);
            }
          },
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
