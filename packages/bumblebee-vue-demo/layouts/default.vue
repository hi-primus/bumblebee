<template>
  <div class="main h-auto w-full">
    <Teleport to="body">
      <ToastContainer
        class="fixed bottom-[4.5rem] left-[2.5rem] z-50 min-w-[calc(12vw+180px)] max-w-[calc(15vw+600px)] flex flex-col gap-3"
      />
      <div
        id="tooltips-container"
        class="absolute w-full h-full pointer-events-none z-[40]"
      ></div>
    </Teleport>
    <slot> </slot>
  </div>
</template>
