<template>
  <article
    aria-hidden="true"
    class="overflow-hidden beans-surface rounded-lg border border-stone-800/90 bg-stone-900/60"
  >
    <div class="flex items-start justify-between gap-3 px-3.5 pt-3.5">
      <div class="min-w-0 flex-1 space-y-2">
        <div class="flex items-center gap-2">
          <USkeleton class="size-7 shrink-0 rounded-full bg-stone-800" />
          <USkeleton class="h-3 w-24 rounded bg-stone-800" />
          <USkeleton class="h-3 w-12 rounded bg-stone-800" />
        </div>
        <USkeleton class="h-5 w-20 rounded bg-stone-800" />
      </div>
      <div class="flex shrink-0 items-center gap-1.5 pt-1">
        <USkeleton class="size-3.5 rounded-full bg-stone-800" />
        <USkeleton class="size-3.5 rounded-full bg-stone-800" />
        <USkeleton class="size-3.5 rounded-full bg-stone-800" />
      </div>
    </div>

    <div class="space-y-2 px-3.5 pb-3 pt-3">
      <USkeleton class="h-4 w-full rounded bg-stone-800" />
      <USkeleton class="h-4 w-3/4 rounded bg-stone-800" />
    </div>

    <USkeleton class="aspect-video w-full rounded-none bg-stone-800" />

    <div class="flex items-center justify-between gap-3 border-t border-stone-800/80 px-3.5 py-3">
      <div class="flex items-center gap-2">
        <USkeleton class="size-7 rounded-full bg-stone-800" />
        <USkeleton class="h-3 w-10 rounded bg-stone-800" />
      </div>
      <div class="flex items-center gap-2">
        <USkeleton class="h-3 w-8 rounded bg-stone-800" />
        <USkeleton class="size-7 rounded-full bg-stone-800" />
      </div>
    </div>
  </article>
</template>
