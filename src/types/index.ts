export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
}

export interface Tag {
  id: number;
  name: string;
  color?: string;
}

export interface Visit {
  id: string;
  place_id: string;
  place_name?: string;
  rating: number;
  review_text?: string;
  review?: string;
  visit_date: string;
  visited_at?: string;
  is_repeat_order?: boolean;
  photo_urls?: string[];
  image_url?: string;
}

export interface Place {
  id: string;
  name: string;
  image_url: string;
  original_link?: string;
  platform?: string;
  
  // Category Info
  category: string;
  category_icon?: string; // Icon dari m_categories
  
  // Price Info
  price_level: string; // Label harga ($$)
  price_description?: string; // Deskripsi harga (50k - 100k)
  
  tags: Tag[];
  gmaps_link?: string;
  target_menu?: string;
  description?: string; // meta_title
  created_by_name?: string; // created_by_user.display_name
  
  distance?: string;
  visits?: Visit[];
}

export interface PlacePayload {
  name: string;
  original_link?: string;
  platform?: string;
  meta_title?: string;
  meta_image?: string;
  maps_link: string;
  target_menu?: string;
  category_id: number;
  price_range_id: number;
  tag_ids: number[];
}

export interface CoupleData {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
}

export interface PartnerData {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  email: string;
}

export interface CoupleStatusResponse {
  has_couple: boolean;
  role: "creator" | "joiner";
  couple_data?: CoupleData;
  partner_data?: PartnerData;
  message?: string;
}

export interface Notification {
  id: string;
  type: "wishlist" | "journal" | "system";
  title: string;
  message: string;
  related_id?: string; // ID tempat/wishlist terkait
  is_read: boolean;
  created_at: string;
}