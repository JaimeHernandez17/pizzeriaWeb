export type CataloguePrice = {
  currency: string;
  incl_tax: string | null;
  excl_tax: string | null;
};

export type CatalogueProduct = {
  id: number;
  title: string;
  slug: string;
  description: string;
  url: string;
  image_url: string;
  price: CataloguePrice;
  upc?: string;
  availability?: string | boolean;
  attributes?: ProductAttribute[];
  images?: string[];
  recommended_products?: CatalogueProduct[];
  variants?: CatalogueProduct[];
  reviews?: ProductReview[];
};

export type ProductReview = {
  id: number;
  title: string;
  body: string;
  score: number;
  name: string;
  date_created: string;
};

export type ProductAttribute = {
  name: string;
  value: string;
};

export type CataloguePagination = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
};

export type CatalogueResponse = {
  items: CatalogueProduct[];
  pagination: CataloguePagination;
  query: string;
  summary: string;
};
