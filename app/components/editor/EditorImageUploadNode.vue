<script setup lang="ts">
import type { NodeViewProps } from '@tiptap/vue-3'
import { NodeViewWrapper } from '@tiptap/vue-3'
import { api } from '~/composables/api'

const props = defineProps<NodeViewProps>()

const file = ref<File | null>(null)
const loading = ref(false)
const uploadError = ref('')

watch(file, async (newFile) => {
  if (!newFile) return

  loading.value = true
  uploadError.value = ''

  try {
    const form = new FormData()
    form.append('file', newFile)
    const res = await api.postForm<{ data: { url: string } }>('/admin/uploads/image', form)
    const url = res.data.url
    if (!url) throw new Error('Upload gagal.')

    const pos = props.getPos()
    if (typeof pos !== 'number') return

    props.editor
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + 1 })
      .setImage({ src: url.startsWith('http') || url.startsWith('/') ? url : `/${url}` })
      .run()
  } catch (e) {
    uploadError.value = e instanceof Error ? e.message : 'Upload gambar gagal.'
    file.value = null
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <NodeViewWrapper>
    <UFileUpload
      v-model="file"
      accept="image/png,image/jpeg,image/gif,image/webp"
      label="Upload an image"
      description="PNG, JPG, GIF atau WebP (maks. 2MB)"
      :preview="false"
      class="min-h-48"
    >
      <template #leading>
        <UAvatar
          :icon="loading ? 'i-lucide-loader-circle' : 'i-lucide-image'"
          size="xl"
          :ui="{ icon: [loading && 'animate-spin'] }"
        />
      </template>
    </UFileUpload>
    <UAlert v-if="uploadError" color="error" variant="soft" :title="uploadError" class="mt-2" />
  </NodeViewWrapper>
</template>
