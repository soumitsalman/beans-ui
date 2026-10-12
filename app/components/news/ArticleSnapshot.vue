<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { NewsArticle, NewsStory } from '~/types/news'
import ArticleSignals from '~/components/news/ArticleSignals.vue'
import ArticleShareModal from '~/components/news/ArticleShareModal.vue'
import StoryHeader from '~/components/news/StoryHeader.vue'
import ArticleSourceLine from '~/components/news/ArticleSourceLine.vue'
import MarkdownSummary from '~/components/news/MarkdownSummary.vue'
import { DEFAULT_SOURCE_ICON, sourceFavicon, sourceLabel } from '~/utils/source'
import { formatCount, formatTaxonomyLabel } from '~/utils/formatters'

const props = defineProps<{ article: NewsArticle, story?: boolean }>()
const { outboundHref } = useOutboundUrl()
const image_failed = ref(false)
const articles_count = computed(() => (props.article as NewsStory).article_count)
const article_href = computed(() => outboundHref(props.article.url))

watch(() => props.article.image_url, () => {
  image_failed.value = false
})
</script>

<template>
  <article class="overflow-hidden beans-surface rounded-lg border border-stone-800/90 bg-stone-900/60">
    <div class="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
      <a
        v-if="article.image_url && !image_failed"
        :href="outboundHref(article.image_url)"
        target="_blank"
        rel="noopener noreferrer"
        :aria-label="`Open image for ${article.title || 'article'}`"
        class="aspect-video w-full shrink-0 overflow-hidden rounded-md bg-stone-800 sm:aspect-square sm:size-36"
      >
        <img
          :src="article.image_url"
          :alt="article.title"
          class="size-full object-cover"
          loading="eager"
          width="640"
          height="360"
          referrerpolicy="no-referrer"
          @error="image_failed = true"
        >
      </a>

      <div class="min-w-0 flex-1 space-y-3">
        <StoryHeader
          v-if="story"
          :story="article"
        />
        <div
          v-else
          class="flex items-start justify-between gap-3 text-[11px] text-stone-500"
        >
          <div class="min-w-0 flex-1">
            <ArticleSourceLine :article="article" />
            <UBadge
              v-if="article.categories[0]"
              color="neutral"
              variant="soft"
              size="sm"
              class="mt-1 bg-stone-800/80 text-primary/90"
            >
              {{ formatTaxonomyLabel(article.categories[0]) }}
            </UBadge>
          </div>
          <ArticleSignals :article="article" />
        </div>

        <h1 class="text-lg font-semibold leading-snug text-stone-100 sm:text-xl">
          <a
            v-if="article_href"
            data-publisher-link
            :href="article_href"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
          >
            {{ article.title || 'Article' }}
          </a>
          <span v-else>{{ article.title || 'Article' }}</span>
        </h1>
        <MarkdownSummary
          v-if="article.summary"
          :summary="article.summary"
          :line_limit="3"
        />
        <div
          v-if="article.regions.length || article.entities.length"
          class="flex flex-wrap gap-1.5"
        >
          <UBadge
            v-for="region in article.regions.slice(0, 3)"
            :key="`region-${region}`"
            color="neutral"
            variant="soft"
            class="max-w-40 truncate bg-stone-800/80 text-stone-400"
          >
            {{ formatTaxonomyLabel(region) }}
          </UBadge>
          <UBadge
            v-for="entity in article.entities.slice(0, 3)"
            :key="`entity-${entity}`"
            color="neutral"
            variant="soft"
            class="max-w-40 truncate bg-stone-800/80 text-stone-400"
          >
            {{ formatTaxonomyLabel(entity) }}
          </UBadge>
        </div>
      </div>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-3 border-t border-stone-800/80 px-3.5 py-3">
      <div
        v-if="story"
        class="flex items-center gap-2 text-[11px] text-stone-500"
      >
        <UAvatarGroup
          v-if="article.other_publishers?.length"
          :max="5"
        >
          <UTooltip
            v-for="publisher in article.other_publishers"
            :key="publisher.id"
            :text="sourceLabel(publisher)"
          >
            <UAvatar
              :src="sourceFavicon(publisher)"
              :alt="sourceLabel(publisher)"
              :icon="DEFAULT_SOURCE_ICON"
            />
          </UTooltip>
        </UAvatarGroup>
        <span v-if="articles_count != null">{{ formatCount(articles_count) }} articles</span>
      </div>
      <ArticleShareModal
        :article_title="article.title"
        :article_url="article.url"
        :article_id="article.id"
        :has_coverage="Boolean(article.story_id)"
        inline
        class="ml-auto min-w-0 max-w-full"
      />
    </div>
  </article>
</template>
