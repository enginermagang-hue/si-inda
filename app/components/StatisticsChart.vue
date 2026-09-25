<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { kabupatenList } from '~/data/kabupaten'

const props = defineProps<{
  category: 'satuan_pendidikan' | 'peserta_didik' | 'guru' | 'tendik'
  data: any[]
}>()

const selectedKabupaten = ref('all')

const kabupatenOptions = computed(() => {
  const allSum = props.data.reduce((sum, d) => sum + (d.value || 0), 0)
  const items = [{ value: 'all', label: `Semua Kabupaten (${allSum})` }]
  for (const k of kabupatenList) {
    const kabupatenData = props.data.filter((d) => d.kabupaten === k.label)
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
  return props.data.filter((d) => d.kabupaten === kabupatenList.find((k) => k.value === selectedKabupaten.value)?.label)
})

const chartEl = ref<HTMLDivElement | null>(null)
let chart: any = null

const series = computed(() => {
  if (props.category === 'satuan_pendidikan') {
    return [
      {
        name: 'Jumlah',
        data: filteredData.value.map((d) => d.value) as number[],
      },
    ]
  }
  if (props.category === 'peserta_didik') {
    return [
      { name: 'Laki-laki', data: filteredData.value.map((d) => d.laki || 0) as number[] },
      { name: 'Perempuan', data: filteredData.value.map((d) => d.perempuan || 0) as number[] },
    ]
  }
  if (props.category === 'guru' || props.category === 'tendik') {
    return [
      { name: 'PNS', data: filteredData.value.map((d) => d.pns || 0) as number[] },
      { name: 'Non-PNS', data: filteredData.value.map((d) => d.non_pns || 0) as number[] },
    ]
  }
  return []
})

const xaxisCategories = computed(() => {
  return filteredData.value.map((d) => `${d.jenjang} - ${d.kabupaten || '-'}`)
})

const chartOptions = computed(() => {
  return {
    chart: {
      type: 'bar' as const,
      toolbar: { show: true },
      animations: { enabled: true },
    },
    plotOptions: {
      bar: { horizontal: false, columnWidth: '60%', borderRadius: 4 },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => val.toLocaleString('id-ID'),
      style: { colors: ['#1f2937'] },
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['#ffffff'],
    },
    tooltip: {
      y: {
        formatter: (val: number) => val.toLocaleString('id-ID'),
      },
    },
    xaxis: {
      categories: xaxisCategories.value,
    },
    yaxis: {
      title: {
        text: 'Jumlah',
      },
    },
    fill: {
      opacity: 1,
    },
    colors: ['#6366f1', '#10b981', '#f59e0b'],
  }
})

function renderChart() {
  if (!chartEl.value) return
  if (chart) {
    chart.destroy()
  }
  import('apexcharts').then((mod) => {
    chart = new mod.default(chartEl.value, {
      ...chartOptions.value,
      series: series.value,
    })
    chart.render()
  })
}

onMounted(() => {
  renderChart()
})

watch(
  () => [selectedKabupaten.value, props.data, props.category] as const,
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

    <div ref="chartEl" class="w-full" />
  </div>
</template>