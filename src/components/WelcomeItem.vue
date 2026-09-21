<template>
  <div class="relative mt-8 flex lg:mt-0 lg:py-2 lg:pl-20">
    <i
      class="flex h-8 w-8 shrink-0 items-center justify-center text-slate-900 lg:absolute lg:-left-6 lg:top-1/2 lg:h-12 lg:w-12 lg:-translate-y-1/2 lg:rounded-lg lg:border lg:border-slate-200 lg:bg-white lg:shadow-sm"
    >
      <slot name="icon"></slot>
    </i>
    <div class="ml-4 min-w-0 flex-1 lg:ml-0">
      <h3 class="mb-1.5 text-lg font-medium text-slate-900">
        <slot name="heading"></slot>
      </h3>
      <div class="text-slate-600">
        <slot></slot>
      </div>
    </div>
  </div>
</template>
