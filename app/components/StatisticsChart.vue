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

const chartEl = ref<HTMLDivElement | null>(null)
let chart: any = null

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

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
      { name: 'ASN', data: filteredData.value.map((d) => d.pns || 0) as number[] },
      { name: 'Non-ASN', data: filteredData.value.map((d) => d.non_pns || 0) as number[] },
    ]
  }
  return []
})

/** Donut saat filter per kabupaten (peserta_didik & tendik): agregat 2 kategori. */
const showDonut = computed(
  () =>
    selectedKabupaten.value !== 'all' &&
    (props.category === 'peserta_didik' || props.category === 'tendik'),
)

const donutConfig = computed(() => {
  if (props.category === 'peserta_didik') {
    const laki = filteredData.value.reduce((s, d) => s + (d.laki || 0), 0)
    const perempuan = filteredData.value.reduce((s, d) => s + (d.perempuan || 0), 0)
    return { series: [laki, perempuan], labels: ['Laki-laki', 'Perempuan'] }
  }
  const asn = filteredData.value.reduce((s, d) => s + (d.pns || 0), 0)
  const nonAsn = filteredData.value.reduce((s, d) => s + (d.non_pns || 0), 0)
  return { series: [asn, nonAsn], labels: ['ASN', 'Non-ASN'] }
})

const donutOptions = computed(() => {
  return {
    chart: {
      type: 'donut' as const,
      toolbar: { show: true },
      animations: { enabled: true },
      foreColor: isDark.value ? '#cbd5e1' : '#475569',
    },
    series: donutConfig.value.series,
    labels: donutConfig.value.labels,
    dataLabels: {
      enabled: true,
      formatter: (val: number, opts: any) =>
        (donutConfig.value.series[opts?.seriesIndex] ?? val).toLocaleString('id-ID'),
      style: { colors: [isDark.value ? '#f1f5f9' : '#1f2937'] },
    },
    tooltip: {
      theme: isDark.value ? 'dark' : 'light',
      y: {
        formatter: (val: number) => val.toLocaleString('id-ID'),
      },
    },
    legend: {
      position: 'bottom' as const,
      horizontalAlign: 'center' as const,
      fontSize: '14px',
    },
    colors: ['#6366f1', '#10b981'],
  }
})

/** Label pendek untuk sumbu-x (jenjang saja); label lengkap ada di tooltip. */
const xaxisCategories = computed(() => {
  return filteredData.value.map((d) => d.jenjang || '-')
})

/** Label lengkap untuk tooltip: jenjang + kabupaten. */
const tooltipTitles = computed(() => {
  return filteredData.value.map((d) => `${d.jenjang || '-'} — ${d.kabupaten || '-'}`)
})

const chartOptions = computed(() => {
  return {
    chart: {
      type: 'area' as const,
      toolbar: { show: true },
      animations: { enabled: true },
      zoom: { enabled: true },
      foreColor: isDark.value ? '#cbd5e1' : '#475569',
    },
    stroke: {
      show: true,
      width: 3,
      curve: 'smooth' as const,
    },
    fill: {
      type: 'gradient' as const,
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
      },
    },
    markers: {
      size: 4,
      hover: { size: 6 },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      theme: isDark.value ? 'dark' : 'light',
      x: {
        formatter: (_val: string, opts?: { dataPointIndex?: number }) =>
          tooltipTitles.value[opts?.dataPointIndex ?? -1] ?? _val,
      },
      y: {
        formatter: (val: number) => val.toLocaleString('id-ID'),
      },
    },
    xaxis: {
      categories: xaxisCategories.value,
      tickAmount: 10,
      labels: {
        rotate: -45,
        trim: true,
        hideOverlappingLabels: true,
      },
    },
    yaxis: {
      title: {
        text: 'Jumlah',
      },
      labels: {
        formatter: (val: number) => Math.round(val).toLocaleString('id-ID'),
      },
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
    chart = new mod.default(
      chartEl.value,
      showDonut.value
        ? donutOptions.value
        : {
            ...chartOptions.value,
            series: series.value,
          },
    )
    chart.render()
  })
}

onMounted(() => {
  renderChart()
})

watch(
  () => [selectedKabupaten.value, props.data, props.category, isDark.value] as const,
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