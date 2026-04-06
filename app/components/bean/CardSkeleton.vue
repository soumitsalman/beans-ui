<script setup lang="ts">
</script>

<template>
  <div class="group relative flex h-full flex-col overflow-hidden rounded-[28px] bg-surface-container-low shadow-2xl ring-1 ring-white/5">
    <div class="relative aspect-[21/9] overflow-hidden">
      <USkeleton class="h-full w-full" />
    </div>

    <div class="flex flex-col gap-3 p-4 flex-1">
      <div class="flex flex-wrap items-center gap-2">
        <USkeleton class="h-5 w-16 rounded-full" />
      </div>

      <div class="space-y-2">
        <USkeleton class="h-6 w-full" />
        <USkeleton class="h-6 w-5/6" />
        <USkeleton class="h-6 w-4/6" />
      </div>

      <div class="flex flex-wrap gap-2">
        <USkeleton class="h-5 w-14 rounded-full" />
        <USkeleton class="h-5 w-20 rounded-full" />
      </div>
    </div>

    <div class="p-4 pt-0">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <USkeleton class="size-8 rounded-full" />
          <div class="grid gap-1">
            <USkeleton class="h-3 w-20" />
            <USkeleton class="h-3 w-14" />
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <USkeleton class="h-6 w-12 rounded-full" />
          <USkeleton class="h-6 w-12 rounded-full" />
          <USkeleton class="h-6 w-8 rounded-full" />
          <USkeleton class="h-6 w-12 rounded-full" />
          <USkeleton class="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  </div>
</template>
