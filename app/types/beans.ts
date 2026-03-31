// Content type constants
export type BeanKind =
	| 'news'
	| 'blog'
	| 'post'
	| 'generated'
	| 'comment';

// Bean represents a single article or post indexed by Beansack.
export interface Bean {
	url: string;
	kind: BeanKind | string;
	title: string;
	summary?: string;
	content?: string;
	author?: string;
	source: string;
	image_url?: string;
	published_at: string; // ISO date-time string
	categories?: string[];
	sentiments?: string[];
	regions?: string[];
	entities?: string[];
}

// Chatter represents short-form discussion metadata associated with a Bean.
export interface Chatter {
	chatter_url: string;
	url: string;
	source?: string;
	forum?: string;
	likes?: number;
	comments?: number;
	subscribers?: number;
	// collected is omitted from JSON
}

// Publisher holds metadata about a content source (publisher).
export interface Publisher {
	source?: string;
	source_base_url?: string;
	source_site_name?: string;
	source_description?: string;
	source_favicon?: string;
	// rss_feed and collected are omitted from JSON
}

// ChatterAggregate represents aggregated social engagement metrics for a Bean URL.
export interface ChatterAggregate {
	url?: string;
	likes?: number;
	comments?: number;
	subscribers?: number;
	shares?: number;
	// collected is omitted from JSON
}

export interface BeanTrend extends Bean {
	likes?: number;
	comments?: number;
	subscribers?: number;
	shares?: number;
	related?: string[];
	cluster_id?: string;
	num_related?: number;
	trend_score?: number;
}

// BeanAggregate contains a Bean plus publisher metadata and aggregated analytics.
export interface BeanExtended extends BeanTrend {
	tags?: string[];
	source_base_url?: string;
	source_site_name?: string;
	source_description?: string;
	source_favicon?: string;
}