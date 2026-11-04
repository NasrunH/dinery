import React from "react";
import { 
  Coffee, 
  Utensils, 
  UtensilsCrossed, 
  Soup, 
  Pizza, 
  Fish, 
  CakeSlice, 
  GlassWater, 
  Flame, 
  Sandwich,
  Store,
  LucideIcon
} from "lucide-react";

interface CategoryIconProps {
  category?: string;
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export function getCategoryIconComponent(category?: string): LucideIcon {
  if (!category) return Utensils;
  const lower = category.toLowerCase().trim();
  
  if (lower.includes("kopi") || lower.includes("cafe") || lower.includes("kafe") || lower.includes("coffee")) {
    return Coffee;
  }
  if (lower.includes("bakso") || lower.includes("mie") || lower.includes("ramen") || lower.includes("soup") || lower.includes("soto") || lower.includes("kuah")) {
    return Soup;
  }
  if (lower.includes("pizza") || lower.includes("burger") || lower.includes("fast food")) {
    return Pizza;
  }
  if (lower.includes("seafood") || lower.includes("ikan") || lower.includes("sushi") || lower.includes("laut")) {
    return Fish;
  }
  if (lower.includes("dessert") || lower.includes("manis") || lower.includes("kue") || lower.includes("cake") || lower.includes("ice cream") || lower.includes("gelato")) {
    return CakeSlice;
  }
  if (lower.includes("bar") || lower.includes("minum") || lower.includes("beverage") || lower.includes("drink") || lower.includes("boba") || lower.includes("juice") || lower.includes("jus")) {
    return GlassWater;
  }
  if (lower.includes("bbq") || lower.includes("grill") || lower.includes("steak") || lower.includes("pedas") || lower.includes("bakar")) {
    return Flame;
  }
  if (lower.includes("roti") || lower.includes("bakery") || lower.includes("sandwich") || lower.includes("snack") || lower.includes("cemilan")) {
    return Sandwich;
  }
  if (lower.includes("street") || lower.includes("kaki lima") || lower.includes("pasar") || lower.includes("warung")) {
    return Store;
  }
  return UtensilsCrossed;
}

export default function CategoryIcon({ category, className = "", size = 16, strokeWidth = 2 }: CategoryIconProps) {
  const Icon = getCategoryIconComponent(category);
  return <Icon size={size} strokeWidth={strokeWidth} className={className} />;
}

