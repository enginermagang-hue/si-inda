<script setup lang="ts">
defineProps<{
  msg: string
}>()
</script>

<template>
  <div class="text-center">
    <h1 class="text-4xl font-medium tracking-tight text-emerald-600">{{ msg }}</h1>
    <h3 class="mt-3 text-lg text-slate-600">
      You’ve successfully created a project with
      <a
        href="https://vite.dev/"
        target="_blank"
        rel="noopener"
        class="font-medium text-emerald-600 underline-offset-4 transition hover:underline"
        >Vite</a
      >
      +
      <a
        href="https://vuejs.org/"
        target="_blank"
        rel="noopener"
        class="font-medium text-emerald-600 underline-offset-4 transition hover:underline"
        >Vue 3</a
      >. What's next?
    </h3>
  </div>
</template>
