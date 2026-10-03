<script setup lang="ts">
import { CAFECITO_LINKS } from '~/settings/site'

const SECTIONS = [
  { title: 'Original reporting stays with the publisher', text: 'Beans is a news discovery app from Project Cafecito. Headlines and concise snapshots link to the original publisher. Beans does not publish the original reporting or replace the full article. Open the publisher link to read its context and check its evidence.' },
  { title: 'Coverage and related reporting', text: 'Articles associated with a story are grouped into a timeline. Dates are the publication dates supplied by the feed; they are not independently verified times of an event. Related reporting provides other accounts to inspect. Grouping can be imperfect: a matching story is not proof that all linked accounts agree or are equally reliable.' },
  { title: 'Article counts and publisher counts', text: 'A coverage article count counts the loaded, deduplicated articles. A source count counts distinct publishers within that group. The related count on a card is supplied by the feed and can differ from the coverage articles currently available. More articles does not mean more independent evidence.' },
  { title: 'Confidence and ideology', text: 'Confidence is an Espresso signal available as low, moderate or high. It is not a fact-check verdict, a probability that a claim is true, or a guarantee of accuracy. Ideology is a feed-supplied label; it does not describe every statement in an article. Missing signals are omitted.' },
  { title: 'Trending and engagement', text: 'Trending indicators use attention signals from the feed. Hot and Trending describe activity, not importance or reliability. Mentions, likes and comments are lower-bound values and may be incomplete; missing or zero counts are hidden.' },
  { title: 'Freshness and selection', text: 'Now shows trending news across all categories, five articles per batch, using a two-day window. Category feeds combine one trending article from that window with four latest articles from the past seven days where available. The interface focuses on English-language news. Source pages can relax those filters when no recent English news is available.' }
]
</script>

<template>
  <section
    id="how-it-works"
    class="space-y-5 scroll-mt-40"
    aria-labelledby="how-it-works-heading"
  >
    <div class="space-y-2">
      <h2
        id="how-it-works-heading"
        class="text-xl font-semibold"
      >
        How Beans works
      </h2>
      <p class="text-sm leading-6 text-stone-400">
        Compare coverage, keep sources visible, and interpret attention signals with care.
      </p>
    </div>
    <UCard
      v-for="section in SECTIONS"
      :key="section.title"
      class="bg-stone-900/50 ring-stone-800/90"
    >
      <h3 class="mb-2 text-base font-semibold">
        {{ section.title }}
      </h3>
      <p class="text-sm leading-6 text-stone-400">
        {{ section.text }}
      </p>
    </UCard>
    <UCard class="bg-stone-900/50 ring-stone-800/90">
      <h3 class="mb-2 text-base font-semibold">
        Report a problem or correction
      </h3>
      <p class="mb-3 text-sm leading-6 text-stone-400">
        Contact Project Cafecito to report a mismatched story, source, signal, or count. Include the Beans page URL and the original publisher link so the issue can be reviewed. Corrections to original reporting belong with the publisher; use the private inquiry channel for confidential requests.
      </p>
      <UButton
        :to="CAFECITO_LINKS.contact"
        external
        label="Report a Beans issue"
        icon="lucide:mail"
        variant="soft"
      />
    </UCard>
    <UCard class="bg-stone-900/50 ring-stone-800/90">
      <h3 class="mb-2 text-base font-semibold">
        Before sharing a story
      </h3>
      <ul class="list-disc space-y-1 pl-5 text-sm leading-6 text-stone-400">
        <li>Read the original publisher article and check its byline and publication date.</li>
        <li>Compare another publisher’s account and distinguish article counts from independent sources.</li>
        <li>Share Beans coverage for comparison, or select the original article to link directly to its publisher.</li>
      </ul>
    </UCard>
  </section>
</template>
