<template>
  <div class="relative flex items-center border-b border-gray-200 h-[97px]">
    <h2 class="text-lg font-semibold text-amber-600">
      <slot name="title" />
    </h2>
    <div class="absolute right-0">
      <slot name="right" />
    </div>
  </div>
</template>
