import { create } from 'zustand'
import type { CreateContactRequest, CreateContactResponse, ContactListResponse, UpdateContactRequest, UpdateContactResponse, ContactItem, BulkUpdateContactResponse, ContactStatus } from '@services/api/contact/contactService'
import { parseApiError, sanitizeErrorForLogging } from '@utils/errorUtils'

// Request counter to prevent race conditions when submitting contact form
// When multiple submit calls are made in quick succession (e.g., double-click),
// only the most recent request should update the state
let submitRequestCounter = 0

// Request counter to prevent race conditions when fetching contacts
// When multiple fetch calls are made in quick succession,
// only the most recent request should update the state
let fetchRequestCounter = 0

// Request counter map to prevent race conditions when updating contacts
// Tracks request counters per contact ID to allow concurrent updates to different contacts
// while preventing race conditions for updates to the same contact
// When multiple update calls are made to the SAME contact in quick succession,
// only the most recent request for that contact should update the state
// Counters are never deleted to prevent request ID reuse which could allow stale
// responses to incorrectly pass the currentRequestId check
const updateRequestCounters = new Map<string, number>()

// Request counter to prevent race conditions when bulk updating contacts
// When multiple bulk update calls are made in quick succession,
// only the most recent request should update the state
let bulkUpdateRequestCounter = 0

// Request counter map to prevent race conditions when deleting contacts
// Tracks request counters per contact ID to allow concurrent deletes to different contacts
// while preventing race conditions for deletes to the same contact
// When multiple delete calls are made to the SAME contact in quick succession,
// only the most recent request for that contact should update the state
// Counters are never deleted to prevent request ID reuse which could allow stale
// responses to incorrectly pass the currentRequestId check
const deleteRequestCounters = new Map<string, number>()

// Map to store the original server state for each contact ID
// This prevents rollback to optimistic states when multiple requests fail
// When request A optimistically updates, then request B starts and both fail,
// request B's rollback should revert to the original server state, not request A's optimistic state
// This map is updated when:
// 1. Contacts are fetched (getContacts) - stores the server state for all contacts
// 2. A contact update succeeds - stores the new server state for that contact
// 3. Contacts are cleared - the map is cleared
const originalContactStates = new Map<string, ContactItem>()

interface ContactState {
  // Loading states
  isSubmitting: boolean
  isLoading: boolean
  // Track which contact IDs are currently being updated
  // This allows concurrent updates to different contacts without race conditions
  updatingContactIds: Set<string>
  isBulkUpdating: boolean
  // Track which contact IDs are currently being deleted
  // This allows concurrent deletes to different contacts without race conditions
  deletingContactIds: Set<string>

  // Error states
  error: string | null
  fetchError: string | null
  // Track update errors per contact ID to prevent concurrent updates from clearing each other's errors
  updateErrors: Map<string, string>
  bulkUpdateError: string | null
  // Track delete errors per contact ID to prevent concurrent deletes from clearing each other's errors
  deleteErrors: Map<string, string>

  // Success state
  lastSubmittedContact: CreateContactResponse | null
  // Track last updated contact per contact ID to prevent concurrent updates from clearing each other's success states
  lastUpdatedContacts: Map<string, UpdateContactResponse>
  lastBulkUpdateResult: BulkUpdateContactResponse | null
  // Track last deleted contact IDs to show success feedback
  lastDeletedContactIds: Set<string>

  // Data state
  contacts: ContactListResponse | null

  // Actions
  submitContact: (data: CreateContactRequest) => Promise<CreateContactResponse>
  getContacts: () => Promise<void>
  updateContact: (id: string, data: UpdateContactRequest) => Promise<UpdateContactResponse>
  bulkUpdateContacts: (ids: string[], status: ContactStatus) => Promise<BulkUpdateContactResponse>
  deleteContact: (id: string) => Promise<void>
  clearError: () => void
  clearFetchError: () => void
  clearUpdateError: (id?: string) => void
  clearBulkUpdateError: () => void
  clearDeleteError: (id?: string) => void
  clearLastSubmitted: () => void
  clearLastUpdated: (id?: string) => void
  clearLastDeleted: (id?: string) => void
  clearContacts: () => void
}

export const useContactStore = create<ContactState>((set, get) => ({
  // Initial state
  isSubmitting: false,
  isLoading: false,
  updatingContactIds: new Set<string>(),
  isBulkUpdating: false,
  deletingContactIds: new Set<string>(),
  error: null,
  fetchError: null,
  updateErrors: new Map(),
  bulkUpdateError: null,
  deleteErrors: new Map(),
  lastSubmittedContact: null,
  lastUpdatedContacts: new Map(),
  lastBulkUpdateResult: null,
  lastDeletedContactIds: new Set<string>(),
  contacts: null,

  // Actions
  submitContact: async (data: CreateContactRequest) => {
    // Increment counter to track this request
    // This prevents race conditions when multiple calls are made rapidly
    submitRequestCounter += 1
    const currentRequestId = submitRequestCounter

    // Set loading state and clear stale data BEFORE any awaited work
    set({ isSubmitting: true, error: null, lastSubmittedContact: null })

    try {
      // Import contactService dynamically to avoid circular dependency
      const { contactService } = await import('@services/api/contact/contactService')

      const response = await contactService.createContact(data)

      // Only update state if this is still the most recent request
      // If a newer request has been made, discard this response
      if (currentRequestId === submitRequestCounter) {
        set({ lastSubmittedContact: response, error: null })
      }

      return response
    } catch (err) {
      // Use parseApiError to handle DRF/Axios errors with proper priority order
      const errorMessage = parseApiError(err, {
        fieldNames: ['name', 'email', 'subject', 'message'],
        defaultMessage: 'Failed to submit contact form. Please try again.',
      })

      // Only update error state if this is still the most recent request
      if (currentRequestId === submitRequestCounter) {
        set({ error: errorMessage })
      }

      // Log only sanitized error information to avoid exposing PII
      console.error('Error submitting contact form:', sanitizeErrorForLogging(err, 'Failed to submit contact form'))

      throw err
    } finally {
      // Only clear loading state if this is still the most recent request
      if (currentRequestId === submitRequestCounter) {
        set({ isSubmitting: false })
      }
    }
  },

  clearError: () => {
    // Invalidate any in-flight requests by incrementing the counter
    // This ensures late-resolving requests won't repopulate the error state
    submitRequestCounter += 1
    // Always reset isSubmitting to prevent it from being stuck in true state
    // if this is called while a request is in-flight
    set({ error: null, isSubmitting: false })
  },

  clearLastSubmitted: () => {
    // Invalidate any in-flight requests by incrementing the counter
    // This ensures late-resolving requests won't repopulate the success state
    submitRequestCounter += 1
    // Always reset isSubmitting to prevent it from being stuck in true state
    // if this is called while a request is in-flight
    set({ lastSubmittedContact: null, isSubmitting: false })
  },

  getContacts: async () => {
    // Increment counter to track this request
    // This prevents race conditions when multiple calls are made rapidly
    fetchRequestCounter += 1
    const currentRequestId = fetchRequestCounter

    // Set loading state and clear any previous errors BEFORE any awaited work
    // Note: contacts are kept to show previous data while reloading
    set({ isLoading: true, fetchError: null })

    try {
      // Import contactService dynamically to avoid circular dependency
      const { contactService } = await import('@services/api/contact/contactService')

      const response = await contactService.getContacts()

      // Only update state if this is still the most recent request
      // If a newer request has been made, discard this response
      if (currentRequestId === fetchRequestCounter) {
        // Update the originalContactStates Map with the fresh server state
        // This ensures future rollbacks use the correct server state
        originalContactStates.clear()
        response.results.forEach((contact) => {
          originalContactStates.set(contact.id, contact)
        })

        set({ contacts: response, fetchError: null })
      }
    } catch (err) {
      // Use parseApiError to handle DRF/Axios errors with proper priority order
      const errorMessage = parseApiError(err, {
        defaultMessage: 'Failed to fetch contacts. Please try again.',
      })

      // Only update error state if this is still the most recent request
      if (currentRequestId === fetchRequestCounter) {
        set({ fetchError: errorMessage })
      }

      // Log only sanitized error information to avoid exposing PII
      console.error('Error fetching contacts:', sanitizeErrorForLogging(err, 'Failed to fetch contacts'))

      // Do not rethrow - error is already persisted to store state
      // This prevents unhandled promise rejections when called from useEffect without await/catch
    } finally {
      // Only clear loading state if this is still the most recent request
      if (currentRequestId === fetchRequestCounter) {
        set({ isLoading: false })
      }
    }
  },

  clearFetchError: () => {
    // Invalidate any in-flight requests by incrementing the counter
    // This ensures late-resolving requests won't repopulate the error state
    fetchRequestCounter += 1
    // Always reset isLoading to prevent it from being stuck in true state
    // if this is called while a request is in-flight
    set({ fetchError: null, isLoading: false })
  },

  clearContacts: () => {
    // Invalidate any in-flight requests by incrementing the counter
    // This ensures late-resolving requests won't repopulate the contacts state
    fetchRequestCounter += 1
    // Invalidate all in-flight submitContact() requests by incrementing the counter
    // This prevents in-flight submits from writing PII back to lastSubmittedContact
    // after logout/clearContacts has been called
    submitRequestCounter += 1
    // Invalidate all in-flight updateContact() requests by incrementing their counters
    // This prevents in-flight updates from writing PII back to originalContactStates
    // and lastUpdatedContact after logout/clearContacts has been called
    updateRequestCounters.forEach((value, key) => {
      updateRequestCounters.set(key, value + 1)
    })
    // Invalidate all in-flight bulkUpdateContacts() requests by incrementing the counter
    // This prevents in-flight bulk updates from writing PII back to state after logout/clearContacts
    bulkUpdateRequestCounter += 1
    // Invalidate all in-flight deleteContact() requests by incrementing their counters
    // This prevents in-flight deletes from writing PII back to state after logout/clearContacts has been called
    deleteRequestCounters.forEach((value, key) => {
      deleteRequestCounters.set(key, value + 1)
    })
    // Clear the original contact states since we're clearing all contacts
    originalContactStates.clear()
    // Always reset isLoading to prevent it from being stuck in true state
    // if this is called while a request is in-flight
    // Also clear update-related state to prevent PII retention and stale UI
    // Also clear submit-related state to prevent PII retention from in-flight submitContact() calls
    // Also clear bulk update-related state to prevent PII retention from in-flight bulkUpdateContacts() calls
    // Also clear delete-related state to prevent PII retention from in-flight deleteContact() calls
    set({
      contacts: null,
      fetchError: null,
      isLoading: false,
      lastUpdatedContacts: new Map(),
      updateErrors: new Map(),
      updatingContactIds: new Set<string>(),
      isBulkUpdating: false,
      bulkUpdateError: null,
      lastBulkUpdateResult: null,
      isSubmitting: false,
      error: null,
      lastSubmittedContact: null,
      deletingContactIds: new Set<string>(),
      deleteErrors: new Map(),
      lastDeletedContactIds: new Set<string>()
    })
  },

  /**
   * Updates a contact by ID with optimistic updates.
   *
   * **IMPORTANT - Race Condition Handling:**
   * This method uses optimistic updates to ensure the UI reflects changes immediately,
   * even when multiple contacts are updated concurrently.
   *
   * - Updates to DIFFERENT contacts can proceed concurrently without interfering
   * - Updates to the SAME contact are serialized: only the most recent request
   *   for that specific contact will update the store state
   * - The contact list is updated IMMEDIATELY (optimistically) before the API call
   * - If the API call fails, the optimistic update is rolled back
   *
   * This approach prevents race conditions where concurrent updates to different contacts
   * could overwrite each other's changes in the contacts list.
   *
   * **Example Usage:**
   * ```tsx
   * // Subscribe to the reactive slice for a specific contact's updating state
   * const isUpdating = useContactStore((s) => s.updatingContactIds.has(contactId))
   * const updateError = useContactStore((s) => s.updateErrors.get(contactId))
   * const lastUpdatedContact = useContactStore((s) => s.lastUpdatedContacts.get(contactId))
   * const updateContact = useContactStore((s) => s.updateContact)
   *
   * // Call the update and handle potential rejections
   * updateContact(contactId, { status: 'read' }).catch((error) => {
   *   // Error is already handled by the store, but we catch to prevent unhandled rejection
   *   // Use updateError from store state instead of logging raw error to avoid exposing sensitive data
   *   console.error('Update failed - check updateError state for details')
   * })
   *
   * // Use store state for UI updates - subscribe to reactive slices
   * if (isUpdating) return <Spinner />
   * if (updateError) return <Error message={updateError} />
   * if (lastUpdatedContact) return <Success contact={lastUpdatedContact} />
   * ```
   *
   * @param id - Contact ID to update
   * @param data - Partial contact data to update
   * @returns Promise that resolves with the API response (may be stale if superseded)
   */
  updateContact: async (id: string, data: UpdateContactRequest) => {
    // Increment counter for this specific contact ID to track this request
    // This prevents race conditions when multiple calls are made rapidly to the SAME contact
    // while allowing concurrent updates to DIFFERENT contacts
    const currentCounter = (updateRequestCounters.get(id) ?? 0) + 1
    updateRequestCounters.set(id, currentCounter)
    const currentRequestId = currentCounter

    // Capture the current fetchRequestCounter at the start of this update
    // This allows us to invalidate only getContacts() calls that started BEFORE this update
    // preventing invalidation of newer fetches that started after this update began
    const fetchCounterAtUpdateStart = fetchRequestCounter

    // Get the original server state for rollback
    // We use the stored original state from the Map instead of the current state
    // to prevent rolling back to an optimistic state if multiple requests fail
    // If not in the Map yet, fall back to current state (first update for this contact)
    let originalContact = originalContactStates.get(id)
    if (!originalContact) {
      const currentState = get()
      originalContact = currentState.contacts?.results.find((contact) => contact.id === id)
      // Store it in the Map for future updates
      if (originalContact) {
        originalContactStates.set(id, originalContact)
      }
    }

    // OPTIMISTIC UPDATE: Update the contact list immediately before the API call
    // This ensures the UI reflects the change instantly, even when multiple contacts
    // are updated concurrently, preventing race conditions where later updates
    // could overwrite earlier ones
    set((state) => {
      // Add this contact ID to the set of contacts being updated
      const newUpdatingContactIds = new Set(state.updatingContactIds)
      newUpdatingContactIds.add(id)

      // Clear any previous error/success for this specific contact
      // This prevents stale feedback from previous updates to the same contact
      const newUpdateErrors = new Map(state.updateErrors)
      newUpdateErrors.delete(id)
      const newLastUpdatedContacts = new Map(state.lastUpdatedContacts)
      newLastUpdatedContacts.delete(id)

      // Avoid no-op update when contacts is null to prevent spurious re-renders
      if (!state.contacts || !originalContact) {
        return {
          updatingContactIds: newUpdatingContactIds,
          updateErrors: newUpdateErrors,
          lastUpdatedContacts: newLastUpdatedContacts
        }
      }

      // Create optimistic updated contact by merging the update data
      // Filter out undefined values to prevent clobbering existing fields when callers
      // pass keys set to undefined (e.g., from form serialization)
      const definedData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
      ) as Partial<ContactItem>
      // Type assertion is safe because we're merging partial update into full contact
      const optimisticContact: ContactItem = { ...originalContact, ...definedData }

      return {
        updatingContactIds: newUpdatingContactIds,
        updateErrors: newUpdateErrors,
        lastUpdatedContacts: newLastUpdatedContacts,
        contacts: {
          ...state.contacts,
          results: state.contacts.results.map((contact) =>
            contact.id === id ? optimisticContact : contact
          ),
        },
      }
    })

    try {
      // Import contactService dynamically to avoid circular dependency
      const { contactService } = await import('@services/api/contact/contactService')

      const response = await contactService.updateContact(id, data)

      // Only update state if this is still the most recent request for this contact
      // If a newer request has been made for this contact, discard this response
      if (currentRequestId === updateRequestCounters.get(id)) {
        // Update the stored server state when a request succeeds
        // This prevents rollbacks from reverting to a state older than what's on the server
        // Example: Request A succeeds (server now has state A), Request B is in-flight,
        // we must store state A so if B fails, rollback uses A (server state), not pre-A state
        // IMPORTANT: Only update for current requests to prevent stale responses from
        // writing PII back to memory after logout/clearContacts has been called
        originalContactStates.set(id, response)
        // Invalidate any in-flight getContacts() requests that started BEFORE this update
        // to prevent them from overwriting the just-updated contact with stale data
        // Only invalidate if no newer fetch has started (fetchRequestCounter hasn't changed)
        // This prevents invalidating user-triggered refreshes that started after this update
        if (fetchRequestCounter === fetchCounterAtUpdateStart) {
          fetchRequestCounter += 1
          // Reset isLoading to prevent it from being stuck true when invalidated
          // fetch requests skip their finally block (request id no longer matches)
          set({ isLoading: false })
        }

        // Update with the actual API response
        set((state) => {
          // Remove this contact ID from the set of contacts being updated
          const newUpdatingContactIds = new Set(state.updatingContactIds)
          newUpdatingContactIds.delete(id)

          // Set success state for this specific contact
          const newLastUpdatedContacts = new Map(state.lastUpdatedContacts)
          newLastUpdatedContacts.set(id, response)

          // Clear any error for this specific contact
          const newUpdateErrors = new Map(state.updateErrors)
          newUpdateErrors.delete(id)

          // Avoid no-op update when contacts is null to prevent spurious re-renders
          if (!state.contacts) {
            return {
              lastUpdatedContacts: newLastUpdatedContacts,
              updateErrors: newUpdateErrors,
              updatingContactIds: newUpdatingContactIds,
            }
          }

          return {
            lastUpdatedContacts: newLastUpdatedContacts,
            updateErrors: newUpdateErrors,
            updatingContactIds: newUpdatingContactIds,
            contacts: {
              ...state.contacts,
              results: state.contacts.results.map((contact) =>
                contact.id === id ? response : contact
              ),
            },
          }
        })
      }

      return response
    } catch (err) {
      // ROLLBACK: Revert the optimistic update on error
      // Only rollback if this is still the most recent request for this contact
      if (currentRequestId === updateRequestCounters.get(id)) {
        // Use parseApiError to handle DRF/Axios errors with proper priority order
        const errorMessage = parseApiError(err, {
          fieldNames: ['name', 'email', 'subject', 'message', 'status'],
          defaultMessage: 'Failed to update contact. Please try again.',
        })

        set((state) => {
          // Remove this contact ID from the set of contacts being updated
          const newUpdatingContactIds = new Set(state.updatingContactIds)
          newUpdatingContactIds.delete(id)

          // Set error state for this specific contact
          const newUpdateErrors = new Map(state.updateErrors)
          newUpdateErrors.set(id, errorMessage)

          // Get the latest confirmed server state from the Map at rollback time
          // This ensures we rollback to the most recent server state, even if an earlier
          // in-flight request succeeded and updated the Map before this request failed
          const rollbackContact = originalContactStates.get(id)

          // Avoid no-op update when contacts is null to prevent spurious re-renders
          if (!state.contacts || !rollbackContact) {
            return {
              updateErrors: newUpdateErrors,
              updatingContactIds: newUpdatingContactIds,
            }
          }

          // Revert the contact back to its original server state
          // rollbackContact comes from the Map at rollback time, ensuring we rollback to the last
          // confirmed server state, not an optimistic state from a concurrent request
          return {
            updateErrors: newUpdateErrors,
            updatingContactIds: newUpdatingContactIds,
            contacts: {
              ...state.contacts,
              results: state.contacts.results.map((contact) =>
                contact.id === id ? rollbackContact : contact
              ),
            },
          }
        })

        // Log only sanitized error information to avoid exposing PII
        // Only log for non-stale requests to prevent noisy logs during rapid superseding updates
        console.error('Error updating contact:', sanitizeErrorForLogging(err, 'Failed to update contact'))
      }

      throw err
    }
  },

  clearUpdateError: (id?: string) => {
    // Clear the error state for a specific contact or all contacts
    // Note: We do NOT clear updateRequestCounters or updatingContactIds here because:
    // 1. Clearing updateRequestCounters would prevent in-flight requests from completing
    //    their error handling (the request ID check would fail), leaving
    //    optimistic updates stuck if the request fails
    // 2. Clearing updatingContactIds would prevent components subscribed to
    //    updatingContactIds.has(id) from showing loading state while requests are still
    //    in-flight, potentially re-enabling UI actions/spinners prematurely.
    //    In-flight requests will properly remove their IDs when they complete.
    set((state) => {
      if (id) {
        // Clear error for specific contact
        const newUpdateErrors = new Map(state.updateErrors)
        newUpdateErrors.delete(id)
        return { updateErrors: newUpdateErrors }
      } else {
        // Clear all errors
        return { updateErrors: new Map() }
      }
    })
  },

  clearLastUpdated: (id?: string) => {
    // Clear the success state for a specific contact or all contacts
    // Note: We do NOT clear updateRequestCounters or updatingContactIds here because:
    // 1. Clearing updateRequestCounters would prevent in-flight requests from completing
    //    their success handling (the request ID check would fail), potentially
    //    leaving optimistic updates stuck if the request completes after this is called
    // 2. Clearing updatingContactIds would prevent components subscribed to
    //    updatingContactIds.has(id) from showing loading state while requests are still
    //    in-flight, potentially re-enabling UI actions/spinners prematurely.
    //    In-flight requests will properly remove their IDs when they complete.
    set((state) => {
      if (id) {
        // Clear success for specific contact
        const newLastUpdatedContacts = new Map(state.lastUpdatedContacts)
        newLastUpdatedContacts.delete(id)
        return { lastUpdatedContacts: newLastUpdatedContacts }
      } else {
        // Clear all success states
        return { lastUpdatedContacts: new Map() }
      }
    })
  },

  clearBulkUpdateError: () => {
    set({ bulkUpdateError: null, lastBulkUpdateResult: null })
  },

  /**
   * Bulk update the status of multiple contacts with optimistic updates.
   *
   * **IMPORTANT - Race Condition Handling:**
   * This method uses optimistic updates to ensure the UI reflects changes immediately.
   * - When multiple bulk update calls are made in quick succession, only the most recent
   *   request will update the store state
   * - The contact list is updated IMMEDIATELY (optimistically) before the API call
   * - If the API call fails, the optimistic update is rolled back
   *
   * **Partial Success Handling:**
   * - If the server returns `updated` count < unique IDs count, some contacts were not updated
   *   (e.g., they no longer exist on the server)
   * - Duplicate IDs in the array are automatically handled (counted as one unique ID)
   * - In this case, the contact list is automatically refreshed to sync with the server state
   * - The UI will show optimistic updates briefly, then sync to actual server state
   *
   * **Example Usage:**
   * ```tsx
   * const isBulkUpdating = useContactStore((s) => s.isBulkUpdating)
   * const bulkUpdateError = useContactStore((s) => s.bulkUpdateError)
   * const lastBulkUpdateResult = useContactStore((s) => s.lastBulkUpdateResult)
   * const bulkUpdateContacts = useContactStore((s) => s.bulkUpdateContacts)
   *
   * // Call the bulk update and handle potential rejections
   * bulkUpdateContacts(selectedIds, 'read').catch((error) => {
   *   // Error is already handled by the store
   *   console.error('Bulk update failed - check bulkUpdateError state for details')
   * })
   *
   * // Use store state for UI updates
   * if (isBulkUpdating) return <Spinner />
   * if (bulkUpdateError) return <Error message={bulkUpdateError} />
   * if (lastBulkUpdateResult) return <Success count={lastBulkUpdateResult.updated} />
   * ```
   *
   * @param ids - Array of contact IDs to update
   * @param status - New status to apply to all specified contacts
   * @returns Promise that resolves with the API response (may be stale if superseded)
   */
  bulkUpdateContacts: async (ids: string[], status: ContactStatus) => {
    // Early return if no IDs provided - nothing to update
    // Clear any stale success/error state to prevent showing outdated UI
    if (ids.length === 0) {
      set({ bulkUpdateError: null, lastBulkUpdateResult: null })
      return { updated: 0, status }
    }

    // Increment counter to track this request
    // This prevents race conditions when multiple calls are made rapidly
    bulkUpdateRequestCounter += 1
    const currentRequestId = bulkUpdateRequestCounter

    // Store the original state for each contact that's not already tracked
    // This ensures originalContactStates has an entry for all contacts in this bulk update
    // so that rollback can use the most recent confirmed server state
    ids.forEach((id) => {
      if (!originalContactStates.has(id)) {
        const currentState = get()
        const originalState = currentState.contacts?.results.find((contact) => contact.id === id)
        // Store it in the Map for future updates
        if (originalState) {
          originalContactStates.set(id, originalState)
        }
      }
    })

    // Set loading state and clear previous error/success BEFORE any awaited work
    set({ isBulkUpdating: true, bulkUpdateError: null, lastBulkUpdateResult: null })

    // OPTIMISTIC UPDATE: Update all contacts immediately before the API call
    set((state) => {
      if (!state.contacts) {
        return {}
      }

      return {
        contacts: {
          ...state.contacts,
          results: state.contacts.results.map((contact) =>
            ids.includes(contact.id) ? { ...contact, status } : contact
          ),
        },
      }
    })

    try {
      // Import contactService dynamically to avoid circular dependency
      const { contactService } = await import('@services/api/contact/contactService')

      const response = await contactService.bulkUpdateContacts(ids, status)

      // Only update state if this is still the most recent request
      // If a newer request has been made, discard this response
      if (currentRequestId === bulkUpdateRequestCounter) {
        // Check for partial success: if response.updated < unique IDs count, some contacts
        // were not updated by the server (e.g., they no longer exist)
        // Use Set to count unique IDs since the ids array could contain duplicates
        const uniqueIdCount = new Set(ids).size
        const isPartialSuccess = response.updated < uniqueIdCount

        if (isPartialSuccess) {
          // Partial success: some IDs were not updated by the server
          // We don't know which specific IDs failed, so we need to fetch fresh data
          // from the server to sync the UI with the actual server state
          // Do NOT update originalContactStates for any contacts to avoid persisting
          // optimistic updates for contacts that the server didn't actually update

          // ALWAYS increment the fetch counter and trigger a refresh in partial-success case
          // This ensures the UI eventually syncs with the server state, even if a concurrent
          // getContacts() started after this update began but returned stale data
          // Without this, the UI could remain stuck showing optimistic statuses for IDs
          // the server didn't actually update
          fetchRequestCounter += 1
          // Reset isLoading to prevent it from being stuck true when invalidated
          // fetch requests skip their finally block (request id no longer matches)
          set({ isLoading: false })

          // Actually trigger a refresh to fetch the current server state
          // Without this, the UI would remain stuck showing optimistic status values
          // until the user manually refreshes
          // IMPORTANT: Only refresh if the user is still authenticated to prevent
          // repopulating PII after logout/clearContacts() has been called
          const { useAuthStore } = await import('@store/authStore')
          // Re-check request freshness after await to prevent stale requests from triggering refresh
          if (currentRequestId === bulkUpdateRequestCounter && useAuthStore.getState().isAuthenticated) {
            get().getContacts()
          }
        } else {
          // Full success: all contacts were updated
          // Update the stored server state for all successfully updated contacts
          // This prevents rollbacks from reverting to a state older than what's on the server
          ids.forEach((id) => {
            const contact = get().contacts?.results.find((c) => c.id === id)
            if (contact) {
              originalContactStates.set(id, { ...contact, status })
            }
          })

          // ALWAYS increment the fetch counter and trigger a refresh in full-success case
          // This ensures the UI syncs with the server state even if a concurrent
          // getContacts() started after this update began but will return stale data
          // Without this, a concurrent getContacts() could overwrite the optimistic
          // status updates with old server data, leaving the UI stale despite successful
          // bulk update
          fetchRequestCounter += 1
          // Reset isLoading to prevent it from being stuck true when invalidated
          // fetch requests skip their finally block (request id no longer matches)
          set({ isLoading: false })

          // Actually trigger a refresh to fetch the updated server state
          // This ensures the UI reflects the actual server state after the bulk update
          // IMPORTANT: Only refresh if the user is still authenticated to prevent
          // repopulating PII after logout/clearContacts() has been called
          const { useAuthStore } = await import('@store/authStore')
          // Re-check request freshness after await to prevent stale requests from triggering refresh
          if (currentRequestId === bulkUpdateRequestCounter && useAuthStore.getState().isAuthenticated) {
            get().getContacts()
          }
        }

        // Re-check request freshness right before writing bulk-update state to prevent
        // stale requests from clobbering newer ones after awaited boundaries above
        if (currentRequestId === bulkUpdateRequestCounter) {
          set({
            isBulkUpdating: false,
            lastBulkUpdateResult: response,
            bulkUpdateError: null
          })
        }
      } else {
        // This request was superseded by a newer request
        // Trigger a refresh to ensure the UI syncs with actual server state
        // This handles the case where this superseded request may have succeeded server-side
        // but its optimistic changes are already overwritten by the newer request
        // Without this refresh, the UI could diverge from the server state
        fetchRequestCounter += 1
        set({ isLoading: false })
        // IMPORTANT: Only refresh if the user is still authenticated to prevent
        // repopulating PII after logout/clearContacts() has been called
        const { useAuthStore } = await import('@store/authStore')
        // Note: This request is already superseded, but we still check auth before refresh
        if (useAuthStore.getState().isAuthenticated) {
          get().getContacts()
        }
      }

      return response
    } catch (err) {
      // ROLLBACK: Revert the optimistic update on error
      // Only rollback if this is still the most recent request
      if (currentRequestId === bulkUpdateRequestCounter) {
        // Use parseApiError to handle DRF/Axios errors with proper priority order
        const errorMessage = parseApiError(err, {
          fieldNames: ['ids', 'status'],
          defaultMessage: 'Failed to bulk update contacts. Please try again.',
        })

        set((state) => {
          if (!state.contacts) {
            return {
              isBulkUpdating: false,
              bulkUpdateError: errorMessage,
            }
          }

          // Revert contacts back to their most recent confirmed server state
          // Use the current originalContactStates instead of a snapshot to ensure we don't
          // overwrite newer confirmed states from other successful requests (e.g., updateContact)
          // that may have completed while this bulk update was in-flight
          return {
            isBulkUpdating: false,
            bulkUpdateError: errorMessage,
            contacts: {
              ...state.contacts,
              results: state.contacts.results.map((contact) => {
                // Only rollback contacts that were part of this bulk update
                if (ids.includes(contact.id)) {
                  const rollbackState = originalContactStates.get(contact.id)
                  return rollbackState || contact
                }
                return contact
              }),
            },
          }
        })

        // Only log for non-stale requests to prevent noisy logs during rapid superseding updates
        console.error('Error bulk updating contacts:', sanitizeErrorForLogging(err, 'Failed to bulk update contacts'))

        // Only throw for the current request so callers can handle it
        // Superseded requests are suppressed to prevent unhandled rejections when a newer request succeeded
        throw err
      }

      // This request was superseded by a newer request
      // Trigger a refresh to ensure the UI syncs with actual server state
      // This is critical because:
      // 1. This superseded request may have failed server-side, leaving optimistic changes
      //    from this request stuck in the UI if the newer request didn't include these IDs
      // 2. This superseded request may have succeeded server-side despite being suppressed,
      //    and a later request failure + rollback could leave client state diverging from server
      // Without this refresh, IDs that aren't included in the newer request can stay stuck
      // in an unconfirmed optimistic status
      fetchRequestCounter += 1
      set({ isLoading: false })
      // IMPORTANT: Only refresh if the user is still authenticated to prevent
      // repopulating PII after logout/clearContacts() has been called
      const { useAuthStore } = await import('@store/authStore')
      // Note: This request is already superseded, but we still check auth before refresh
      if (useAuthStore.getState().isAuthenticated) {
        get().getContacts()
      }

      // Suppress errors from superseded/stale requests to match the docstring's
      // "store handles the error" expectation - a newer request has taken over
      // and the UI should reflect that request's state, not this stale one's error
      // Return a response indicating this was a stale request (0 updated)
      return { updated: 0, status }
    }
  },

  /**
   * Delete a contact by ID with optimistic updates.
   *
   * **IMPORTANT - Race Condition Handling:**
   * This method uses optimistic updates to ensure the UI reflects changes immediately.
   * - Deletes to DIFFERENT contacts can proceed concurrently without interfering
   * - Deletes to the SAME contact are serialized: only the most recent request
   *   for that specific contact will update the store state
   * - The contact is removed from the list IMMEDIATELY (optimistically) before the API call
   * - If the API call fails, the optimistic deletion is rolled back
   *
   * **Example Usage:**
   * ```tsx
   * const isDeleting = useContactStore((s) => s.deletingContactIds.has(contactId))
   * const deleteError = useContactStore((s) => s.deleteErrors.get(contactId))
   * const wasDeleted = useContactStore((s) => s.lastDeletedContactIds.has(contactId))
   * const deleteContact = useContactStore((s) => s.deleteContact)
   *
   * // Call the delete and handle potential rejections
   * deleteContact(contactId).catch((error) => {
   *   // Error is already handled by the store
   *   console.error('Delete failed - check deleteError state for details')
   * })
   *
   * // Use store state for UI updates
   * if (isDeleting) return <Spinner />
   * if (deleteError) return <Error message={deleteError} />
   * if (wasDeleted) return <Success message="Contact deleted" />
   * ```
   *
   * @param id - Contact ID to delete
   * @returns Promise that resolves when the deletion completes (may be stale if superseded)
   */
  deleteContact: async (id: string) => {
    // Increment counter for this specific contact ID to track this request
    // This prevents race conditions when multiple calls are made rapidly to the SAME contact
    // while allowing concurrent deletes to DIFFERENT contacts
    const currentCounter = (deleteRequestCounters.get(id) ?? 0) + 1
    deleteRequestCounters.set(id, currentCounter)
    const currentRequestId = currentCounter

    // Capture the current fetchRequestCounter at the start of this delete
    // This allows us to invalidate only getContacts() calls that started BEFORE this delete
    // preventing invalidation of newer fetches that started after this delete began
    const fetchCounterAtDeleteStart = fetchRequestCounter

    // Get the original server state for rollback
    // We use the stored original state from the Map instead of the current state
    // to prevent rolling back to an optimistic state if multiple requests fail
    // If not in the Map yet, fall back to current state (first delete for this contact)
    let originalContact = originalContactStates.get(id)
    if (!originalContact) {
      const currentState = get()
      originalContact = currentState.contacts?.results.find((contact) => contact.id === id)
      // Store it in the Map for future operations
      if (originalContact) {
        originalContactStates.set(id, originalContact)
      }
    }

    // OPTIMISTIC UPDATE: Remove the contact from the list immediately before the API call
    // This ensures the UI reflects the change instantly
    set((state) => {
      // Add this contact ID to the set of contacts being deleted
      const newDeletingContactIds = new Set(state.deletingContactIds)
      newDeletingContactIds.add(id)

      // Clear any previous error/success for this specific contact
      const newDeleteErrors = new Map(state.deleteErrors)
      newDeleteErrors.delete(id)
      const newLastDeletedContactIds = new Set(state.lastDeletedContactIds)
      newLastDeletedContactIds.delete(id)

      // Avoid no-op update when contacts is null to prevent spurious re-renders
      if (!state.contacts || !originalContact) {
        return {
          deletingContactIds: newDeletingContactIds,
          deleteErrors: newDeleteErrors,
          lastDeletedContactIds: newLastDeletedContactIds
        }
      }

      return {
        deletingContactIds: newDeletingContactIds,
        deleteErrors: newDeleteErrors,
        lastDeletedContactIds: newLastDeletedContactIds,
        contacts: {
          ...state.contacts,
          // Remove the contact from the results array
          results: state.contacts.results.filter((contact) => contact.id !== id),
          // Decrement the count to reflect the deletion
          count: state.contacts.count - 1
        },
      }
    })

    try {
      // Import contactService dynamically to avoid circular dependency
      const { contactService } = await import('@services/api/contact/contactService')

      await contactService.deleteContact(id)

      // Only update state if this is still the most recent request for this contact
      // If a newer request has been made for this contact, discard this response
      if (currentRequestId === deleteRequestCounters.get(id)) {
        // Remove from the stored server state map since it no longer exists
        originalContactStates.delete(id)

        // Invalidate any in-flight getContacts() requests that started BEFORE this delete
        // to prevent them from re-adding the just-deleted contact with stale data
        // Only invalidate if no newer fetch has started (fetchRequestCounter hasn't changed)
        // This prevents invalidating user-triggered refreshes that started after this delete
        if (fetchRequestCounter === fetchCounterAtDeleteStart) {
          fetchRequestCounter += 1
          // Reset isLoading to prevent it from being stuck true when invalidated
          // fetch requests skip their finally block (request id no longer matches)
          set({ isLoading: false })
        }

        // Update success state
        set((state) => {
          // Remove this contact ID from the set of contacts being deleted
          const newDeletingContactIds = new Set(state.deletingContactIds)
          newDeletingContactIds.delete(id)

          // Set success state for this specific contact
          const newLastDeletedContactIds = new Set(state.lastDeletedContactIds)
          newLastDeletedContactIds.add(id)

          // Clear any error for this specific contact
          const newDeleteErrors = new Map(state.deleteErrors)
          newDeleteErrors.delete(id)

          return {
            lastDeletedContactIds: newLastDeletedContactIds,
            deleteErrors: newDeleteErrors,
            deletingContactIds: newDeletingContactIds,
          }
        })
      }
    } catch (err) {
      // ROLLBACK: Revert the optimistic deletion on error
      // Only rollback if this is still the most recent request for this contact
      if (currentRequestId === deleteRequestCounters.get(id)) {
        // Use parseApiError to handle DRF/Axios errors with proper priority order
        const errorMessage = parseApiError(err, {
          defaultMessage: 'Failed to delete contact. Please try again.',
        })

        set((state) => {
          // Remove this contact ID from the set of contacts being deleted
          const newDeletingContactIds = new Set(state.deletingContactIds)
          newDeletingContactIds.delete(id)

          // Set error state for this specific contact
          const newDeleteErrors = new Map(state.deleteErrors)
          newDeleteErrors.set(id, errorMessage)

          // Get the latest confirmed server state from the Map at rollback time
          const rollbackContact = originalContactStates.get(id)

          // Avoid no-op update when contacts is null to prevent spurious re-renders
          if (!state.contacts || !rollbackContact) {
            return {
              deleteErrors: newDeleteErrors,
              deletingContactIds: newDeletingContactIds,
            }
          }

          // Re-add the contact back to the results array
          return {
            deleteErrors: newDeleteErrors,
            deletingContactIds: newDeletingContactIds,
            contacts: {
              ...state.contacts,
              results: [...state.contacts.results, rollbackContact],
              // Restore the count
              count: state.contacts.count + 1
            },
          }
        })

        // Log only sanitized error information to avoid exposing PII
        console.error('Error deleting contact:', sanitizeErrorForLogging(err, 'Failed to delete contact'))
      }

      throw err
    }
  },

  clearDeleteError: (id?: string) => {
    // Clear the error state for a specific contact or all contacts
    set((state) => {
      if (id) {
        // Clear error for specific contact
        const newDeleteErrors = new Map(state.deleteErrors)
        newDeleteErrors.delete(id)
        return { deleteErrors: newDeleteErrors }
      } else {
        // Clear all errors
        return { deleteErrors: new Map() }
      }
    })
  },

  clearLastDeleted: (id?: string) => {
    // Clear the success state for a specific contact or all contacts
    set((state) => {
      if (id) {
        // Clear success for specific contact
        const newLastDeletedContactIds = new Set(state.lastDeletedContactIds)
        newLastDeletedContactIds.delete(id)
        return { lastDeletedContactIds: newLastDeletedContactIds }
      } else {
        // Clear all success states
        return { lastDeletedContactIds: new Set<string>() }
      }
    })
  },
}))

// Subscribe to auth state changes and clear contacts when user logs out
// This prevents retaining PII (name, email, message) in the originalContactStates Map
// after logout, addressing security concerns about module-scoped state retention
import('@store/authStore')
  .then(({ useAuthStore }) => {
    let previousAuthState = useAuthStore.getState().isAuthenticated

    const unsubscribe = useAuthStore.subscribe((state) => {
      const currentAuthState = state.isAuthenticated

      // Detect transition from authenticated to unauthenticated
      if (previousAuthState === true && currentAuthState === false) {
        console.log('🔒 User logged out - clearing contacts and PII from memory')
        useContactStore.getState().clearContacts()
      }

      previousAuthState = currentAuthState
    })

    // Clean up subscription on HMR module disposal to prevent memory leaks
    if (import.meta.hot) {
      import.meta.hot.dispose(() => {
        unsubscribe()
      })
    }
  })
  .catch((error) => {
    console.error('Failed to load authStore for logout cleanup subscription:', error)
  })

