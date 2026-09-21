<template>
  <div class="flex min-h-screen flex-col bg-default text-default">
    <SiteNavbar />
    <NewsTicker />
    <UContainer class="w-full flex-1 py-8">
      <slot />
    </UContainer>
    <SiteFooter />
  </div>
</template>
