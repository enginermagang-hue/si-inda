<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'
import { useAuthStore, useSiteStore } from '~/stores/site'

const open = ref(true)

const auth = useAuthStore()
const site = useSiteStore()
const colorMode = useColorMode()

await site.load()

async function logout(): Promise<void> {
  await auth.logout()
  await navigateTo('/admin/login')
}

function getItems(state: 'collapsed' | 'expanded') {
  return [
    {
      label: 'Dashboard',
      icon: 'i-lucide-inbox',
      to: '/admin',
      exact: true
    },
    {
      label: 'Statistik',
      icon: 'i-lucide-chart-column',
      to: '/admin/statistik'
    },
    {
      label: 'Halaman Syarat',
      icon: 'i-lucide-file-text',
      to: '/admin/halaman'
    },
    {
      label: 'Surat Informasi',
      icon: 'i-lucide-mail',
      to: '/admin/surat'
    },
    {
      label: 'SOP',
      icon: 'i-lucide-clipboard-list',
      to: '/admin/sop'
    },
    {
      label: 'Link Informasi',
      icon: 'i-lucide-link',
      to: '/admin/link'
    },
    {
      label: 'FAQ',
      icon: 'i-lucide-circle-help',
      to: '/admin/faq'
    },
    {
      label: 'Breaking News',
      icon: 'i-lucide-newspaper',
      to: '/admin/berita'
    },
    {
      label: 'Pengaduan',
      icon: 'i-lucide-message-square',
      to: '/admin/pengaduan'
    },
    {
      label: 'Pengaturan',
      icon: 'i-lucide-settings',
      defaultOpen: true,
      children:
        state === 'expanded'
          ? [
              {
                label: 'Umum',
                icon: 'i-lucide-sliders-horizontal',
                to: '/admin/pengaturan'
              },
              {
                label: 'Ganti Password',
                icon: 'i-lucide-key-round',
                to: '/admin/password'
              }
            ]
          : []
    }
  ] satisfies NavigationMenuItem[]
}

const user = computed(() => ({
  name: auth.admin?.name ?? 'Admin',
  avatar: {
    alt: auth.admin?.name ?? 'Admin'
  }
}))

const userItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: 'Ganti Password',
      icon: 'i-lucide-key-round',
      to: '/admin/password'
    },
    {
      label: 'Lihat Situs',
      icon: 'i-lucide-globe',
      to: '/'
    }
  ],
  [
    {
      label: 'Appearance',
      icon: 'i-lucide-sun-moon',
      children: [
        {
          label: 'Light',
          icon: 'i-lucide-sun',
          type: 'checkbox',
          checked: colorMode.value === 'light',
          onUpdateChecked(checked: boolean) {
            if (checked) {
              colorMode.preference = 'light'
            }
          },
          onSelect(e: Event) {
            e.preventDefault()
          }
        },
        {
          label: 'Dark',
          icon: 'i-lucide-moon',
          type: 'checkbox',
          checked: colorMode.value === 'dark',
          onUpdateChecked(checked: boolean) {
            if (checked) {
              colorMode.preference = 'dark'
            }
          },
          onSelect(e: Event) {
            e.preventDefault()
          }
        }
      ]
    }
  ],
  [
    {
      label: 'Log out',
      icon: 'i-lucide-log-out',
      onSelect: logout
    }
  ]
])
</script>

<template>
  <div class="flex flex-1">
    <USidebar
      v-model:open="open"
      collapsible="icon"
      rail
      :ui="{
        container: 'h-full',
        inner: 'bg-elevated/25 divide-transparent',
        body: 'py-0'
      }"
    >
      <template #header>
        <UButton
          icon="i-lucide-school"
          :label="site.settings.site_name"
          to="/admin"
          color="neutral"
          variant="ghost"
          block
          class="overflow-hidden"
          :ui="{
            label: 'truncate'
          }"
        />
      </template>

      <template #default="{ state }">
        <UNavigationMenu
          :key="state"
          :items="getItems(state)"
          orientation="vertical"
          :ui="{ link: 'p-1.5 overflow-hidden' }"
        />
      </template>

      <template #footer>
        <UDropdownMenu
          :items="userItems"
          :content="{ align: 'center', collisionPadding: 12 }"
          :ui="{ content: 'w-(--reka-dropdown-menu-trigger-width) min-w-48' }"
        >
          <UButton
            v-bind="user"
            :label="user?.name"
            trailing-icon="i-lucide-chevrons-up-down"
            color="neutral"
            variant="ghost"
            square
            class="w-full data-[state=open]:bg-elevated overflow-hidden"
            :ui="{
              trailingIcon: 'text-dimmed ms-auto'
            }"
          />
        </UDropdownMenu>
      </template>
    </USidebar>

    <div class="flex-1 flex flex-col">
      <div class="h-(--ui-header-height) shrink-0 flex items-center px-4 border-b border-default">
        <UButton
          icon="i-lucide-panel-left"
          color="neutral"
          variant="ghost"
          aria-label="Toggle sidebar"
          @click="open = !open"
        />
      </div>

      <div class="flex-1 p-4">
        <main class="mx-auto max-w-5xl">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>
