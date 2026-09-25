<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { kabupatenList } from '~/data/kabupaten'

const props = defineProps<{
  data: any[]
}>()

const selectedKabupaten = ref('all')

const kabupatenOptions = computed(() => {
  const allSum = props.data.reduce((sum, d) => sum + (d.value || 0), 0)
  const items = [{ value: 'all', label: `Semua Kabupaten (${allSum})` }]
  for (const k of kabupatenList) {
    const kabupatenData = props.data.filter((d) => d.kabupaten === k.value)
    if (kabupatenData.length > 0) {
      const sum = kabupatenData.reduce((s, d) => s + (d.value || 0), 0)
      items.push({ value: k.value, label: `${k.label} (${sum})` })
    }
  }
  return items
})

const filteredData = computed(() => {
  if (selectedKabupaten.value === 'all') {
    return props.data
  }
  return props.data.filter((d) => d.kabupaten === kabupatenList.find((k) => k.value === selectedKabupaten.value)?.value)
})

const donutSeries = computed(() => {
  const totalPNS = filteredData.value.reduce((sum, d) => sum + (d.pns || 0), 0)
  const totalNonPNS = filteredData.value.reduce((sum, d) => sum + (d.non_pns || 0), 0)
  return [totalPNS, totalNonPNS]
})

const donutLabels = ['PNS', 'Non-PNS']

const totalGuru = computed(() => {
  return donutSeries.value[0] + donutSeries.value[1]
})

const chartEl = ref<HTMLDivElement | null>(null)
let chart: any = null

function renderChart() {
  if (!chartEl.value) return
  if (chart) {
    chart.destroy()
  }
  import('apexcharts').then((mod) => {
    chart = new mod.default(chartEl.value, {
      chart: {
        type: 'donut' as const,
        toolbar: { show: true },
        animations: { enabled: true },
      },
      series: donutSeries.value,
      labels: donutLabels,
      dataLabels: {
        enabled: true,
        formatter: (val: number, opts: any) => {
          const seriesIdx = opts?.seriesIndex
          const seriesData = opts?.series || opts?.globals?.series || donutSeries.value
          const rawValue = seriesData[seriesIdx] ?? val
          return rawValue.toLocaleString('id-ID')
        },
        style: { colors: ['#1f2937'] },
      },
      tooltip: {
        y: {
          formatter: (val: number) => val.toLocaleString('id-ID'),
        },
      },
      legend: {
        position: 'bottom' as const,
        horizontalAlign: 'center' as const,
        fontSize: '14px',
      },
      fill: {
        opacity: 1,
      },
      colors: ['#6366f1', '#10b981'],
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 280,
            },
            legend: {
              position: 'bottom',
            },
          },
        },
      ],
    })
    chart.render()
  })
}

onMounted(() => {
  renderChart()
})

watch(
  () => [selectedKabupaten.value, props.data] as const,
  () => {
    renderChart()
  }
)
</script>

<template>
  <div v-if="data.length === 0" class="py-8 text-center text-muted">
    Data belum tersedia
  </div>

  <div v-else class="space-y-4">
    <div class="mb-3">
      <USelect
        v-model="selectedKabupaten"
        :items="kabupatenOptions"
        value-key="value"
        label-key="label"
        placeholder="Pilih kabupaten"
        class="w-full"
      />
    </div>

    <div class="flex items-center justify-between mb-2">
      <p class="text-sm text-muted">Kabupaten: {{ selectedKabupaten === 'all' ? 'Semua Kabupaten' : kabupatenList.find((k) => k.value === selectedKabupaten)?.label || '-' }}</p>
      <p class="text-lg font-bold text-primary">
        Total: {{ totalGuru.toLocaleString('id-ID') }}
      </p>
    </div>

    <div ref="chartEl" class="w-full" />
  </div>
</template>