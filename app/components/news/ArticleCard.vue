<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { NewsArticle, NewsPublisher } from '~/types/news'
import MarkdownSummary from '~/components/news/MarkdownSummary.vue'
import ArticleSignals from '~/components/news/ArticleSignals.vue'
import ArticleSourceLine from '~/components/news/ArticleSourceLine.vue'
import ArticleShareModal from '~/components/news/ArticleShareModal.vue'
import ArticleTrendCounts from '~/components/news/ArticleTrendCounts.vue'
import { formatCount, formatTaxonomyLabel } from '~/utils/formatters'
import { DEFAULT_SOURCE_ICON, sourceFavicon, sourceIdentity, sourceLabel } from '~/utils/source'
import { hasPositiveCount } from '~/utils/trend'
import { withBeansShareAttribution } from '~/utils/outboundUrl'

const props = defineProps<{ article: NewsArticle }>()
const { outboundHref } = useOutboundUrl()
const image_failed = ref(false)
const card_image = useTemplateRef<HTMLImageElement>('card-image')
const summary = computed(() => props.article.summary?.trim())
const show_image = computed(() => Boolean(props.article.image_url) && !image_failed.value)
const share_url = computed(() => withBeansShareAttribution(props.article.url))
const title_link = computed(() => props.article.story_id && props.article.id
  ? `/articles/${props.article.id}`
  : undefined)
const external_article_url = computed(() => !title_link.value && props.article.url
  ? outboundHref(props.article.url)
  : undefined)
const image_entities = computed(() => props.article.entities.filter(Boolean).slice(0, 2))
const image_regions = computed(() => props.article.regions.filter(Boolean).slice(0, 2))
const show_text_tags = computed(() => !show_image.value
  && Boolean(image_entities.value.length || image_regions.value.length))
const related_count = computed(() => props.article.trend?.related)
const show_card_footer = computed(() => Boolean(props.article.other_publishers?.length)
  || hasPositiveCount(related_count.value)
  || [props.article.trend?.mentions, props.article.trend?.comments, props.article.trend?.likes].some(hasPositiveCount)
  || Boolean(share_url.value || title_link.value))

watch(() => props.article.image_url, () => {
  image_failed.value = false
})

onMounted(() => {
  // An SSR image can fail before hydration attaches its error listener.
  if (card_image.value?.complete && !card_image.value.naturalWidth) image_failed.value = true
})

function publisherIdentity(publisher: NewsPublisher): string {
  return publisher.source?.id || sourceIdentity(publisher) || publisher.id
}

function publisherLabel(publisher: NewsPublisher): string {
  return sourceLabel(publisher) || 'Publisher'
}

function publisherHref(publisher: NewsPublisher): string | undefined {
  return publisher.source?.id ? `/sources/${publisher.source.id}` : undefined
}
</script>

<template>
  <article class="overflow-hidden rounded-lg border border-stone-800/90 bg-stone-900/60">
    <div class="flex items-start justify-between gap-3 px-3.5 pt-3.5">
      <div class="min-w-0 flex-1">
        <ArticleSourceLine :article="article" />
        <UBadge
          v-if="article.categories[0]"
          color="neutral"
          variant="soft"
          size="sm"
          class="mt-1 max-w-full truncate bg-stone-800/80 text-primary/90"
        >
          {{ formatTaxonomyLabel(article.categories[0]) }}
        </UBadge>
      </div>
      <ArticleSignals :article="article" />
    </div>

    <div class="px-3.5 pb-3 pt-1">
      <h2 class="text-[15px] font-semibold leading-snug text-stone-100 sm:text-base">
        <NuxtLink
          v-if="title_link"
          :to="title_link"
          class="hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
        >
          {{ article.title }}
        </NuxtLink>
        <a
          v-else-if="external_article_url"
          data-publisher-link
          :href="external_article_url"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
        >
          {{ article.title }}
        </a>
        <span v-else>{{ article.title }}</span>
      </h2>
      <MarkdownSummary
        v-if="summary && !show_image"
        :summary="summary"
        :line_limit="2"
        class="mt-2 break-words"
      />
      <div
        v-if="show_text_tags"
        class="mt-2 flex flex-wrap gap-1.5"
        role="group"
        aria-label="Article entities and regions"
      >
        <UBadge
          v-for="region in image_regions"
          :key="`region-${region}`"
          color="neutral"
          variant="soft"
          size="sm"
          class="max-w-32 truncate bg-stone-950/75 text-stone-200"
        >
          {{ formatTaxonomyLabel(region) }}
        </UBadge>
        <UBadge
          v-for="entity in image_entities"
          :key="`entity-${entity}`"
          color="neutral"
          variant="soft"
          size="sm"
          class="max-w-32 truncate bg-stone-950/75 text-stone-200"
        >
          {{ formatTaxonomyLabel(entity) }}
        </UBadge>
      </div>
    </div>

    <div
      v-if="show_image"
      class="relative max-h-[34rem] overflow-hidden bg-stone-800"
    >
      <a
        :href="outboundHref(article.image_url)"
        target="_blank"
        rel="noopener noreferrer"
        :aria-label="`Open image for ${article.title || 'article'}`"
        class="block"
      >
        <img
          ref="card-image"
          :src="article.image_url || undefined"
          :alt="article.title"
          class="aspect-video max-h-[34rem] w-full object-cover"
          width="960"
          height="540"
          loading="lazy"
          referrerpolicy="no-referrer"
          @error="image_failed = true"
        >
      </a>
      <div
        v-if="summary || image_entities.length || image_regions.length"
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 bg-linear-to-t from-stone-950 from-0% via-stone-950/85 via-35% to-transparent to-70%"
      />
      <div
        v-if="summary || image_entities.length || image_regions.length"
        class="absolute inset-x-0 bottom-0 space-y-2 px-3 pb-3"
      >
        <MarkdownSummary
          v-if="summary"
          :summary="summary"
          :line_limit="2"
          on_image
          class="break-words"
        />
        <div
          v-if="image_entities.length || image_regions.length"
          class="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Article entities and regions"
        >
          <UBadge
            v-for="region in image_regions"
            :key="`region-${region}`"
            color="neutral"
            variant="soft"
            size="sm"
            class="max-w-32 truncate bg-stone-950/75 text-stone-200"
          >
            {{ formatTaxonomyLabel(region) }}
          </UBadge>
          <UBadge
            v-for="entity in image_entities"
            :key="`entity-${entity}`"
            color="neutral"
            variant="soft"
            size="sm"
            class="max-w-32 truncate bg-stone-950/75 text-stone-200"
          >
            {{ formatTaxonomyLabel(entity) }}
          </UBadge>
        </div>
      </div>
    </div>

    <div
      v-if="show_card_footer"
      class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-stone-800/80 px-3.5 py-3 text-[11px] text-stone-500"
    >
      <div
        v-if="article.other_publishers?.length || hasPositiveCount(related_count)"
        class="flex shrink-0 items-center gap-2"
      >
        <UAvatarGroup
          v-if="article.other_publishers?.length"
          :max="5"
        >
          <UTooltip
            v-for="publisher in article.other_publishers"
            :key="publisherIdentity(publisher)"
            :text="publisherLabel(publisher)"
          >
            <NuxtLink
              :to="publisherHref(publisher)"
              data-publisher-link
              :aria-label="`Open ${publisherLabel(publisher)}`"
              class="rounded-full focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <UAvatar
                :src="sourceFavicon(publisher)"
                :alt="publisherLabel(publisher)"
                :icon="DEFAULT_SOURCE_ICON"
                loading="lazy"
                referrerpolicy="no-referrer"
              />
            </NuxtLink>
          </UTooltip>
        </UAvatarGroup>
        <span
          v-if="hasPositiveCount(related_count)"
          class="inline-flex items-center gap-1 tabular-nums"
          :aria-label="`${formatCount(related_count)} related articles`"
        >
          <UIcon
            name="lucide:files"
            class="size-3 text-primary"
            aria-hidden="true"
          />
          {{ formatCount(related_count) }}
        </span>
      </div>
      <div class="ml-auto flex shrink-0 items-center gap-2.5">
        <ArticleTrendCounts
          :trend="article.trend"
          :show_related="false"
        />
        <ArticleShareModal
          v-if="share_url || title_link"
          :article_title="article.title"
          :article_url="article.url"
          :article_id="article.id"
          :has_coverage="Boolean(title_link)"
        />
      </div>
    </div>
  </article>
</template>
