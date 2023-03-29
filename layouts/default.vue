<template>
  <div class="main h-auto w-full">
    <Teleport to="body">
      <ToastContainer
        class="fixed bottom-[4.5rem] left-[2.5rem] z-50 min-w-[calc(12vw+180px)] max-w-[calc(15vw+600px)] flex flex-col gap-3"
      />
      <ConfirmationPopupContainer />
      <div
        id="tooltips-container"
        class="absolute top-0 left-0 w-screen h-screen max-w-screen max-h-screen overflow-hidden pointer-events-none z-[40]"
      ></div>
    </Teleport>
    <slot> </slot>
  </div>
</template>
