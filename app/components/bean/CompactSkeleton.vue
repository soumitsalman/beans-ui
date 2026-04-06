<script setup lang="ts">
</script>

<template>
  <article class="group overflow-hidden rounded-[24px] bg-transparent">
    <div class="flex gap-4 p-2 sm:p-3">
      <div class="relative h-24 w-24 shrink-0 overflow-hidden rounded-[18px] sm:h-28 sm:w-28">
        <USkeleton class="h-full w-full" />
      </div>

      <div class="min-w-0 flex-1 space-y-2 gap-2">
        <div class="flex flex-wrap items-center gap-2 w-full justify-between">
          <div class="flex items-center gap-2">
            <USkeleton class="h-5 w-16 rounded-full" />
            <USkeleton class="h-5 w-14 rounded-full" />
          </div>
          <USkeleton class="h-3 w-20" />
        </div>

        <div class="space-y-1">
          <USkeleton class="h-5 w-full" />
          <USkeleton class="h-5 w-4/5" />
        </div>

        <div class="flex flex-wrap items-center gap-2 w-full justify-between">
          <div class="flex items-center gap-2">
            <USkeleton class="h-3 w-3 rounded-full" />
            <USkeleton class="h-3 w-24" />
          </div>

          <div class="flex items-center gap-2">
            <USkeleton class="h-6 w-6 rounded-full" />
            <USkeleton class="h-6 w-6 rounded-full" />
            <USkeleton class="h-6 w-6 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  </article>
</template>
