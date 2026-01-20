import type { Category, CategoryWithChildren } from '@features/products/types'
import { deburr } from 'lodash'

/**
 * Converts a category name to a URL-friendly slug
 * Handles diacritics, punctuation, and special characters
 *
 * Examples:
 * - "Basket Ball" -> "basket-ball"
 * - "Men's Clothing" -> "mens-clothing"
 * - "Café & Restaurant" -> "cafe-restaurant"
 * - "Über Cool!" -> "uber-cool"
 *
 * TEMPORARY FIX: This is a workaround until the backend exposes the slug field
 * in the category API response. Once the backend includes the slug field,
 * we should use that directly instead of generating it from the name.
 *
 * @param name - Category name
 * @returns URL-friendly slug
 */
export function categoryNameToSlug(name: string): string {
  return (
    deburr(name) // Remove diacritics (é -> e, ñ -> n, etc.)
      .toLowerCase() // Convert to lowercase
      .replace(/[^\w\s-]/g, '') // Remove all non-word chars except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
  )
}

/**
 * Transforms a flat array of categories into a hierarchical tree structure
 *
 * Categories where parent === null are root categories (top-level)
 * Categories where parent !== null are child categories (reference parent by ID)
 *
 * @param categories - Flat array of categories from API
 * @returns Hierarchical array of categories with children
 */
export function buildCategoryTree(categories: Category[]): CategoryWithChildren[] {
  if (!categories || categories.length === 0) {
    return []
  }

  // Create a map for quick lookup
  const categoryMap = new Map<string, CategoryWithChildren>()

  // Initialize all categories in the map
  categories.forEach((category) => {
    categoryMap.set(category.id, { ...category, children: [] })
  })

  const rootCategories: CategoryWithChildren[] = []

  // Build the tree structure
  categories.forEach((category) => {
    const categoryWithChildren = categoryMap.get(category.id)

    if (!categoryWithChildren) return

    // If parent is null, it's a root category
    if (!category.parent) {
      rootCategories.push(categoryWithChildren)
    } else {
      // It's a child category, add it to its parent
      const parent = categoryMap.get(category.parent)
      if (parent) {
        if (!parent.children) {
          parent.children = []
        }
        parent.children.push(categoryWithChildren)
      }
    }
  })

  return rootCategories
}

/**
 * Flattens a hierarchical category tree back into a flat array
 * Useful for searching or filtering
 *
 * @param categories - Hierarchical array of categories
 * @returns Flat array of all categories
 */
export function flattenCategoryTree(categories: CategoryWithChildren[]): Category[] {
  const result: Category[] = []

  function traverse(category: CategoryWithChildren) {
    const { children, ...categoryData } = category
    result.push(categoryData)

    if (children && children.length > 0) {
      children.forEach(traverse)
    }
  }

  categories.forEach(traverse)
  return result
}

/**
 * Finds a category by ID in a hierarchical tree
 *
 * @param categories - Hierarchical array of categories
 * @param id - Category ID to find
 * @returns Category if found, undefined otherwise
 */
export function findCategoryById(
  categories: CategoryWithChildren[],
  id: string
): CategoryWithChildren | undefined {
  for (const category of categories) {
    if (category.id === id) {
      return category
    }

    if (category.children && category.children.length > 0) {
      const found = findCategoryById(category.children, id)
      if (found) {
        return found
      }
    }
  }

  return undefined
}
