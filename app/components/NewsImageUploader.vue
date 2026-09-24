<template>
  <div class="space-y-3">
    <UFileUpload
      v-model="selectedFiles"
      multiple
      :preview="false"
      :reset="true"
      accept="image/*"
      label="Pilih gambar (banyak)"
      description="PNG, JPG, GIF, WebP — maks 2 MB per file"
    />

    <div v-if="pendingUploads.length" class="space-y-2">
      <div v-for="(p, i) in pendingUploads" :key="i" class="flex items-center gap-3 bg-elevated/50 rounded-lg p-3">
        <div class="shrink-0 w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden">
          <img v-if="p.preview" :src="p.preview" class="w-full h-full object-cover">
          <UIcon v-else name="i-lucide-image" class="text-lg text-muted" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">{{ p.file.name }}</p>
          <UFormField label="Deskripsi">
            <UInput v-model="p.description" placeholder="Tambahkan deskripsi..." />
          </UFormField>
        </div>
        <UButton variant="ghost" color="neutral" icon="i-lucide-x" @click="removePending(i)" />
      </div>
    </div>

    <div v-if="existingImages.length" class="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
      <div
        v-for="(img, i) in existingImages"
        :key="img.id"
        class="relative rounded-lg overflow-hidden border border-default bg-elevated/50 group"
      >
            <img
              :src="img.filePath ?? ''"
              class="w-full h-32 object-cover cursor-pointer"
              loading="lazy"
              @click="$emit('view', img, i)"
            >
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end opacity-0 group-hover:opacity-100">
          <div class="flex items-center gap-1 p-2 w-full">
            <UButton
              size="sm"
              variant="ghost"
              color="neutral"
              icon="i-lucide-eye"
              class="bg-black/50"
              @click.stop="$emit('view', img, i)"
            />
            <UButton
              size="sm"
              variant="ghost"
              color="neutral"
              icon="i-lucide-trash-2"
              class="bg-black/50 ml-auto"
              @click.stop="$emit('remove', img.id)"
            />
          </div>
        </div>
        <div class="p-2">
          <UFormField :label="`Gambar ${i + 1}`">
            <UInput
              :model-value="img.description ?? ''"
              placeholder="Deskripsi..."
              @update:model-value="$emit('updateDescription', img.id, $event)"
            />
          </UFormField>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NewsImage } from '~/composables/api'

interface PendingFile {
  file: File
  description: string
  preview: string | null
}

const _props = defineProps<{
  existingImages: NewsImage[]
}>()

const emit = defineEmits<{
  (e: 'remove', imageId: number): void
  (e: 'upload', files: File[], descriptions: string[]): void
  (e: 'updateDescription', imageId: number, description: string): void
  (e: 'view', image: NewsImage, index: number): void
}>()

const selectedFiles = ref<File[]>([])
const pendingUploads = ref<PendingFile[]>([])

function removePending(i: number) {
  const p = pendingUploads.value[i]
  if (p?.preview) URL.revokeObjectURL(p.preview)
  pendingUploads.value.splice(i, 1)
}

watch(selectedFiles, (files) => {
  if (!files || !files.length) return
  pendingUploads.value = [
    ...pendingUploads.value,
    ...files.map((f) => ({
      file: f,
      description: '',
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
    })),
  ]
  selectedFiles.value = []
})

function doUpload(): void {
  if (!pendingUploads.value.length) return
  const upFiles = pendingUploads.value.map((p) => p.file)
  const upDescriptions = pendingUploads.value.map((p) => p.description)
  emit('upload', upFiles, upDescriptions)
  pendingUploads.value.forEach((p) => { if (p.preview) URL.revokeObjectURL(p.preview) })
  pendingUploads.value = []
}

defineExpose({ doUpload })
</script>
