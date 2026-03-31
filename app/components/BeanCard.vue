<template>  
    <UCard variant="soft" class="my-1 p-2">
        <div class="flex gap-2 items-start">
            <img
                v-if="bean.image_url"
                :src="bean.image_url"
                :alt="bean.title"
                class="w-28 h-28 rounded-xl overflow-hidden"
            >
            <h2 class="text-sm font-bold">{{ bean.title }}</h2>
        </div>
        <template #footer>
            <div class="flex gap-1 items-center">
                <UUser :avatar="{src: publisher?.source_favicon, alt: publisher?.source_site_name}" :name="publisher?.source_site_name" :description="bean.author" />                
            </div>
        </template>
    </UCard>

</template>

<script setup lang="ts">
import type { Bean, BeanTrend, BeanExtended, Publisher } from '~/types/beans';

const props = defineProps<{
    bean: Bean | BeanTrend | BeanExtended;
    publisher?: Publisher;
}>()

</script>