import type { Bean, BeanTrend, BeanExtended, Publisher } from '~/types/beans';
import { useRuntimeConfig } from '#imports';

type FetchParams = Record<string, any>;

const getOptions = (params?: FetchParams) => {
	const config = useRuntimeConfig();
	const BASE_URL = config.public.BEANS_API_BASE_URL as string;
	const API_KEY = config.public.BEANS_API_KEY as string;
	return {
		baseURL: BASE_URL,
		headers: API_KEY ? { 'X-API-KEY': API_KEY } : undefined,
		params,
	};
};

const apiGet = async <T>(path: string, params?: FetchParams) => {
	return await $fetch<T>(path, getOptions(params));
};

// --- TAGS ---


export const fetchCategories = async (params?: { limit?: number; offset?: number }) => {
	return await apiGet<string[]>(`/tags/categories`, params);
};

export const fetchEntities = async (params?: { limit?: number; offset?: number }) => {
	return await apiGet<string[]>(`/tags/entities`, params);
};

export const fetchRegions = async (params?: { limit?: number; offset?: number }) => {
	return await apiGet<string[]>(`/tags/regions`, params);
};

// --- PUBLISHERS ---


export const fetchPublishers = async (params: { sources: string[]; limit?: number; offset?: number }) => {
	return await apiGet<Publisher[]>(`/sources`, params);
};

// --- ARTICLES ---

export interface ArticleSearchParams {
	q?: string;
	acc?: number;
	content_type?: string;
	urls?: string[];
	tags?: string[];
	categories?: string[];
	regions?: string[];
	entities?: string[];
	sources?: string[];
	from?: string; // YYYY-MM-DD
	full_content?: boolean;
	limit?: number;
	offset?: number;
}


export const searchArticles = async (params: ArticleSearchParams) => {
	return await apiGet<BeanExtended[]>(`/articles/search`, params);
};

export const fetchLatestArticles = async (params?: ArticleSearchParams) => {
	return await apiGet<Bean[]>(`/articles/latest`, params);
};



export const fetchTrendingArticles = async (params?: ArticleSearchParams) => {
	return await apiGet<BeanTrend[]>(`/articles/trending`, params);
};

export const fetchTopHeadlines = async (params?: ArticleSearchParams) => {
	return await apiGet<BeanTrend[]>(`/articles/top-headlines`, params);
};

