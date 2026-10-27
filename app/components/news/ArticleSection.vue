<script setup lang="ts">
import ContinuationFooter from './ContinuationFooter.vue'
import type { ContinuationAccess } from '#shared/continuation'
import { computed } from 'vue'
import type { NewsArticle } from '~/types/news'
import StoryCard from '~/components/news/StoryCard.vue'
import ArticleCard from '~/components/news/ArticleCard.vue'
import StoryCardSkeleton from '~/components/news/StoryCardSkeleton.vue'
import ArticleCardSkeleton from '~/components/news/ArticleCardSkeleton.vue'

const STACKED_LIST_CLASS = 'space-y-3'
const WIDE_GRID_CLASS = 'grid grid-cols-1 items-start gap-3 md:grid-cols-2'

const props = withDefaults(defineProps<{
  continuation_access?: ContinuationAccess
  title?: string
  articles: NewsArticle[]
  loading: boolean
  can_load_more: boolean
  error_message?: string | null
  empty_message?: string
  wide_grid?: boolean
  stories?: boolean
}>(), {
  continuation_access: undefined,
  title: undefined,
  error_message: null,
  empty_message: 'Nothing is available yet.',
  wide_grid: false,
  stories: false
})

const list_class = computed(() => props.wide_grid ? WIDE_GRID_CLASS : STACKED_LIST_CLASS)
const { action_blocked, cooldown_message } = useActionCooldown()

const emit = defineEmits<{
  'renew-access': []
  'load-more': []
  'retry': []
}>()
</script>

<template>
  <section class="space-y-3">
    <h2
      v-if="title"
      class="px-1 text-base font-semibold text-stone-100 sm:text-lg"
    >
      {{ title }}
    </h2>

    <UAlert
      v-if="error_message || action_blocked"
      color="warning"
      variant="subtle"
      icon="lucide:triangle-alert"
      :title="cooldown_message || error_message || undefined"
    >
      <template #actions>
        <UButton
          label="Retry"
          color="warning"
          variant="outline"
          size="xs"
          :loading="loading"
          :disabled="loading || action_blocked"
          @click="emit('retry')"
        />
      </template>
    </UAlert>

    <div
      v-if="articles.length"
      :class="list_class"
      :aria-busy="loading"
    >
      <template
        v-for="article in articles"
        :key="article.id || article.url || 'article'"
      >
        <StoryCard
          v-if="stories"
          :story="article"
        />
        <ArticleCard
          v-else
          :article="article"
        />
      </template>
    </div>

    <div
      v-else-if="loading"
      :class="list_class"
      aria-label="Loading articles"
    >
      <template
        v-for="item in 2"
        :key="item"
      >
        <StoryCardSkeleton v-if="stories" />
        <ArticleCardSkeleton v-else />
      </template>
    </div>
    <UAlert
      v-else-if="!error_message && !action_blocked"
      color="neutral"
      variant="subtle"
      icon="lucide:inbox"
      :title="empty_message"
    />

    <UIcon
      v-if="loading && articles.length && !can_load_more"
      name="lucide:loader-circle"
      class="size-4 animate-spin text-stone-400"
      aria-label="Updating articles"
    />

    <ContinuationFooter
      v-if="!error_message"
      :visible_count="articles.length"
      :access="continuation_access"
      :can_load_more="can_load_more"
      :loading="loading"
      @more="emit('load-more')"
      @renew="emit('renew-access')"
    />
  </section>
</template>
