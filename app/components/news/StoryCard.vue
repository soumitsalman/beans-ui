<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { NewsStory, NewsPublisher } from '~/types/news'
import MarkdownSummary from '~/components/news/MarkdownSummary.vue'
import StoryHeader from '~/components/news/StoryHeader.vue'
import ArticleShareModal from '~/components/news/ArticleShareModal.vue'
import ArticleTrendCounts from '~/components/news/ArticleTrendCounts.vue'
import { formatCount, formatTaxonomyLabel } from '~/utils/formatters'
import { DEFAULT_SOURCE_ICON, sourceFavicon, sourceIdentity, sourceLabel } from '~/utils/source'
import { hasPositiveCount } from '~/utils/trend'
import { withBeansShareAttribution } from '~/utils/outboundUrl'

const props = defineProps<{ story: NewsStory }>()
const image_failed = ref(false)
const card_image = useTemplateRef<HTMLImageElement>('card-image')
const summary = computed(() => props.story.summary?.trim())
const show_image = computed(() => Boolean(props.story.image_url) && !image_failed.value)
const share_url = computed(() => withBeansShareAttribution(props.story.url))
const title_link = computed(() => `/stories/${props.story.id}`)
const image_entities = computed(() => props.story.entities.filter(Boolean).slice(0, 2))
const image_regions = computed(() => props.story.regions.filter(Boolean).slice(0, 2))
const show_text_tags = computed(() => !show_image.value
  && Boolean(image_entities.value.length || image_regions.value.length))
function openStory(event: MouseEvent): void {
  if ((event.target as Element)?.closest('a, button, [role="button"]')) return
  void navigateTo(title_link.value)
}

const related_count = computed(() => props.story.article_count)
const show_card_footer = computed(() => Boolean(props.story.other_publishers?.length)
  || related_count.value != null
  || [props.story.trend?.mentions, props.story.trend?.comments, props.story.trend?.likes].some(hasPositiveCount)
  || Boolean(share_url.value || title_link.value))

watch(() => props.story.image_url, () => {
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
  <article
    class="cursor-pointer overflow-hidden beans-surface rounded-lg border border-stone-800/90 bg-stone-900/60"
    @click="openStory"
  >
    <StoryHeader
      :story="story"
      class="px-3.5 pt-3.5"
    />

    <div class="px-3.5 pb-3 pt-1">
      <h2 class="text-[15px] font-semibold leading-snug text-stone-100 sm:text-base">
        <NuxtLink
          :to="title_link"
          class="hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
        >
          {{ story.title }}
        </NuxtLink>
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
      <NuxtLink
        :to="title_link"
        :aria-label="`Open image for ${story.title || 'article'}`"
        class="block"
      >
        <img
          ref="card-image"
          :src="story.image_url || undefined"
          :alt="story.title"
          class="aspect-video max-h-[34rem] w-full object-cover"
          width="960"
          height="540"
          loading="lazy"
          referrerpolicy="no-referrer"
          @error="image_failed = true"
        >
      </NuxtLink>
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
        v-if="story.other_publishers?.length || related_count != null"
        class="flex shrink-0 items-center gap-2"
      >
        <UAvatarGroup
          v-if="story.other_publishers?.length"
          :max="5"
        >
          <UTooltip
            v-for="publisher in story.other_publishers"
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
          v-if="related_count != null"
          class="inline-flex items-center gap-1 tabular-nums"
          :aria-label="`${formatCount(related_count)} articles`"
        >
          <UIcon
            name="lucide:files"
            class="size-3 text-primary"
            aria-hidden="true"
          />
          {{ formatCount(related_count) }} articles
        </span>
      </div>
      <div class="ml-auto flex shrink-0 items-center gap-2.5">
        <ArticleTrendCounts
          :trend="story.trend"
          :show_related="false"
        />
        <ArticleShareModal
          v-if="share_url || title_link"
          :article_title="story.title"
          :article_url="story.url"
          :article_id="story.id"
          :has_coverage="Boolean(title_link)"
        />
      </div>
    </div>
  </article>
</template>
