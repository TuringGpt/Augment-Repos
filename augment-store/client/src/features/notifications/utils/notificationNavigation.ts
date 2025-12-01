import { ROUTES } from '@constants/index'

/**
 * Maps notification model types to their corresponding routes
 */
const MODEL_ROUTE_MAP: Record<string, (objectId: string) => string> = {
  order: (objectId) => ROUTES.ORDER_DETAIL.replace(':id', objectId),
  product: (objectId) => ROUTES.PRODUCT_DETAIL.replace(':id', objectId),
  supportticket: (objectId) => ROUTES.SUPPORT_TICKET_DETAIL.replace(':id', objectId),
  ticket: (objectId) => ROUTES.SUPPORT_TICKET_DETAIL.replace(':id', objectId),
}

/**
 * Gets the navigation path for a notification based on its model and objectId
 * @param model - The model type (e.g., 'order', 'product', 'supportticket')
 * @param objectId - The ID of the object
 * @returns The navigation path, or null if no route is found
 */
export const getNotificationNavigationPath = (
  model: string | null,
  objectId: string | null
): string | null => {
  if (!model || !objectId) {
    return null
  }

  const normalizedModel = model.toLowerCase()
  const routeGenerator = MODEL_ROUTE_MAP[normalizedModel]

  if (!routeGenerator) {
    return null
  }

  return routeGenerator(objectId)
}

/**
 * Checks if a notification is clickable (has a valid navigation path)
 * @param model - The model type
 * @param objectId - The ID of the object
 * @returns True if the notification is clickable, false otherwise
 */
export const isNotificationClickable = (
  model: string | null,
  objectId: string | null
): boolean => {
  return getNotificationNavigationPath(model, objectId) !== null
}

