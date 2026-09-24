<script setup lang="ts">
const { data, pending } = await useFetch<{ data: { total: number; today: number; todayUniques: number; online: number } }>('/api/visits/stats', {
  default: () => ({ data: { total: 0, today: 0, todayUniques: 0, online: 0 } }),
})

function fmt(n: number): string {
  return n.toLocaleString('id-ID')
}
</script>

<template>
  <div
    class="inline-flex flex-wrap items-center justify-center lg:justify-start gap-1.5 sm:gap-2 text-xs"
    aria-label="Statistik pengunjung"
  >
    <template v-if="pending">
      <USkeleton class="h-6 w-24 rounded-full" />
      <USkeleton class="h-6 w-20 rounded-full" />
      <USkeleton class="h-6 w-20 rounded-full" />
    </template>
    <template v-else>
      <div class="flex gap-3">
        <span class="inline-flex items-center gap-1.5 rounded-full border border-default bg-elevated/60 px-2.5 py-1 text-muted">
          <UIcon name="i-lucide-eye" class="size-3.5 shrink-0" />
          Hari ini <strong class="font-semibold text-highlighted">{{ fmt(data.data.today) }}</strong>
        </span>
        <span class="inline-flex items-center gap-1.5 rounded-full border border-default bg-elevated/60 px-2.5 py-1 text-muted">
          Total <strong class="font-semibold text-highlighted">{{ fmt(data.data.total) }}</strong>
        </span>
        <span class="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-success">
          <span class="size-1.5 rounded-full bg-success animate-pulse" aria-hidden="true" />
          Online <strong class="font-semibold">{{ fmt(data.data.online) }}</strong>
        </span>
      </div>
    </template>
  </div>
</template>
