import { create } from 'zustand'
import type { CreateContactRequest, CreateContactResponse, ContactListResponse, UpdateContactRequest, UpdateContactResponse, ContactItem } from '@services/api/contact/contactService'
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

  // Error states
  error: string | null
  fetchError: string | null
  updateError: string | null

  // Success state
  lastSubmittedContact: CreateContactResponse | null
  lastUpdatedContact: UpdateContactResponse | null

  // Data state
  contacts: ContactListResponse | null

  // Actions
  submitContact: (data: CreateContactRequest) => Promise<CreateContactResponse>
  getContacts: () => Promise<void>
  updateContact: (id: string, data: UpdateContactRequest) => Promise<UpdateContactResponse>
  clearError: () => void
  clearFetchError: () => void
  clearUpdateError: () => void
  clearLastSubmitted: () => void
  clearLastUpdated: () => void
  clearContacts: () => void
  // Helper to check if a specific contact is being updated
  isContactUpdating: (id: string) => boolean
}

export const useContactStore = create<ContactState>((set, get) => ({
  // Initial state
  isSubmitting: false,
  isLoading: false,
  updatingContactIds: new Set<string>(),
  error: null,
  fetchError: null,
  updateError: null,
  lastSubmittedContact: null,
  lastUpdatedContact: null,
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
    // Clear the original contact states since we're clearing all contacts
    originalContactStates.clear()
    // Always reset isLoading to prevent it from being stuck in true state
    // if this is called while a request is in-flight
    set({ contacts: null, fetchError: null, isLoading: false })
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
   * const { updateContact, lastUpdatedContact, updateError, isContactUpdating } = useContactStore()
   *
   * // Call the update and handle potential rejections
   * updateContact(contactId, { status: 'read' }).catch((error) => {
   *   // Error is already handled by the store, but we catch to prevent unhandled rejection
   *   // Use updateError from store state instead of logging raw error to avoid exposing sensitive data
   *   console.error('Update failed - check updateError state for details')
   * })
   *
   * // Use store state for UI updates - check if specific contact is being updated
   * if (isContactUpdating(contactId)) return <Spinner />
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

      // Avoid no-op update when contacts is null to prevent spurious re-renders
      if (!state.contacts || !originalContact) {
        return {
          updatingContactIds: newUpdatingContactIds,
          updateError: null,
          lastUpdatedContact: null
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
        updateError: null,
        lastUpdatedContact: null,
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

      // Always update the stored server state when a request succeeds, even if stale
      // This prevents rollbacks from reverting to a state older than what's on the server
      // Example: Request A succeeds (server now has state A), Request B is in-flight,
      // we must store state A so if B fails, rollback uses A (server state), not pre-A state
      originalContactStates.set(id, response)

      // Only update state if this is still the most recent request for this contact
      // If a newer request has been made for this contact, discard this response
      if (currentRequestId === updateRequestCounters.get(id)) {
        // Invalidate any in-flight getContacts() requests that started BEFORE this update
        // to prevent them from overwriting the just-updated contact with stale data
        // Only invalidate if no newer fetch has started (fetchRequestCounter hasn't changed)
        // This prevents invalidating user-triggered refreshes that started after this update
        // Also reset isLoading to prevent it from being stuck true if invalidated
        // fetch requests skip their finally block
        if (fetchRequestCounter === fetchCounterAtUpdateStart) {
          fetchRequestCounter += 1
        }

        // Update with the actual API response
        set((state) => {
          // Remove this contact ID from the set of contacts being updated
          const newUpdatingContactIds = new Set(state.updatingContactIds)
          newUpdatingContactIds.delete(id)

          // Avoid no-op update when contacts is null to prevent spurious re-renders
          if (!state.contacts) {
            return {
              lastUpdatedContact: response,
              updateError: null,
              updatingContactIds: newUpdatingContactIds,
            }
          }

          return {
            lastUpdatedContact: response,
            updateError: null,
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

          // Get the latest confirmed server state from the Map at rollback time
          // This ensures we rollback to the most recent server state, even if an earlier
          // in-flight request succeeded and updated the Map before this request failed
          const rollbackContact = originalContactStates.get(id)

          // Avoid no-op update when contacts is null to prevent spurious re-renders
          if (!state.contacts || !rollbackContact) {
            return {
              updateError: errorMessage,
              updatingContactIds: newUpdatingContactIds,
            }
          }

          // Revert the contact back to its original server state
          // rollbackContact comes from the Map at rollback time, ensuring we rollback to the last
          // confirmed server state, not an optimistic state from a concurrent request
          return {
            updateError: errorMessage,
            updatingContactIds: newUpdatingContactIds,
            contacts: {
              ...state.contacts,
              results: state.contacts.results.map((contact) =>
                contact.id === id ? rollbackContact : contact
              ),
            },
          }
        })
      }

      // Log only sanitized error information to avoid exposing PII
      console.error('Error updating contact:', sanitizeErrorForLogging(err, 'Failed to update contact'))

      throw err
    }
  },

  clearUpdateError: () => {
    // Clear the error state
    // Note: We do NOT clear updateRequestCounters or updatingContactIds here because:
    // 1. Clearing updateRequestCounters would prevent in-flight requests from completing
    //    their error handling (the request ID check at line 335 would fail), leaving
    //    optimistic updates stuck if the request fails
    // 2. Clearing updatingContactIds would make isContactUpdating() report false while
    //    requests are still in-flight, potentially re-enabling UI actions/spinners
    //    prematurely. In-flight requests will properly remove their IDs when they complete.
    set({ updateError: null })
  },

  clearLastUpdated: () => {
    // Clear the success state
    // Note: We do NOT clear updateRequestCounters or updatingContactIds here because:
    // 1. Clearing updateRequestCounters would prevent in-flight requests from completing
    //    their success handling (the request ID check at line 288 would fail), potentially
    //    leaving optimistic updates stuck if the request completes after this is called
    // 2. Clearing updatingContactIds would make isContactUpdating() report false while
    //    requests are still in-flight, potentially re-enabling UI actions/spinners
    //    prematurely. In-flight requests will properly remove their IDs when they complete.
    set({ lastUpdatedContact: null })
  },

  // Helper to check if a specific contact is being updated
  isContactUpdating: (id: string) => {
    return get().updatingContactIds.has(id)
  },
}))

