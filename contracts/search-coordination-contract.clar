;; Search Coordination Contract
;; Organizes volunteer search party efforts

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u200))
(define-constant ERR_SEARCH_NOT_FOUND (err u201))
(define-constant ERR_VOLUNTEER_NOT_FOUND (err u202))
(define-constant ERR_ALREADY_ASSIGNED (err u203))
(define-constant ERR_INVALID_DATA (err u204))

;; Data Variables
(define-data-var next-search-id uint u1)
(define-data-var next-volunteer-id uint u1)

;; Data Maps
(define-map search-operations
  { search-id: uint }
  {
    pet-id: uint,
    coordinator: principal,
    search-area: (string-ascii 100),
    center-latitude: int,
    center-longitude: int,
    radius-meters: uint,
    status: (string-ascii 20),
    volunteers-needed: uint,
    volunteers-assigned: uint,
    created-at: uint,
    updated-at: uint
  }
)

(define-map volunteers
  { volunteer-id: uint }
  {
    volunteer: principal,
    name: (string-ascii 50),
    phone: (string-ascii 20),
    experience-level: (string-ascii 20),
    availability: (string-ascii 50),
    registered-at: uint,
    searches-completed: uint,
    rating: uint
  }
)

(define-map search-assignments
  { search-id: uint, volunteer: principal }
  {
    assigned-area: (string-ascii 100),
    start-latitude: int,
    start-longitude: int,
    end-latitude: int,
    end-longitude: int,
    assigned-at: uint,
    status: (string-ascii 20),
    progress-notes: (string-ascii 200)
  }
)

(define-map volunteer-searches
  { volunteer: principal }
  { search-ids: (list 20 uint) }
)

;; Public Functions

;; Create a new search operation
(define-public (create-search-operation
  (pet-id uint)
  (search-area (string-ascii 100))
  (center-latitude int)
  (center-longitude int)
  (radius-meters uint)
  (volunteers-needed uint)
)
  (let
    (
      (search-id (var-get next-search-id))
      (current-time (unwrap-panic (get-block-info? time (- block-height u1))))
    )
    ;; Validate input data
    (asserts! (> pet-id u0) ERR_INVALID_DATA)
    (asserts! (> (len search-area) u0) ERR_INVALID_DATA)
    (asserts! (> volunteers-needed u0) ERR_INVALID_DATA)

    ;; Create search operation
    (map-set search-operations
      { search-id: search-id }
      {
        pet-id: pet-id,
        coordinator: tx-sender,
        search-area: search-area,
        center-latitude: center-latitude,
        center-longitude: center-longitude,
        radius-meters: radius-meters,
        status: "active",
        volunteers-needed: volunteers-needed,
        volunteers-assigned: u0,
        created-at: current-time,
        updated-at: current-time
      }
    )

    ;; Increment search ID counter
    (var-set next-search-id (+ search-id u1))

    (ok search-id)
  )
)

;; Register as a volunteer
(define-public (register-volunteer
  (name (string-ascii 50))
  (phone (string-ascii 20))
  (experience-level (string-ascii 20))
  (availability (string-ascii 50))
)
  (let
    (
      (volunteer-id (var-get next-volunteer-id))
      (current-time (unwrap-panic (get-block-info? time (- block-height u1))))
    )
    ;; Validate input data
    (asserts! (> (len name) u0) ERR_INVALID_DATA)
    (asserts! (> (len phone) u0) ERR_INVALID_DATA)

    ;; Register volunteer
    (map-set volunteers
      { volunteer-id: volunteer-id }
      {
        volunteer: tx-sender,
        name: name,
        phone: phone,
        experience-level: experience-level,
        availability: availability,
        registered-at: current-time,
        searches-completed: u0,
        rating: u5
      }
    )

    ;; Initialize volunteer search list
    (map-set volunteer-searches
      { volunteer: tx-sender }
      { search-ids: (list) }
    )

    ;; Increment volunteer ID counter
    (var-set next-volunteer-id (+ volunteer-id u1))

    (ok volunteer-id)
  )
)

;; Assign volunteer to search
(define-public (assign-volunteer-to-search
  (search-id uint)
  (volunteer principal)
  (assigned-area (string-ascii 100))
  (start-latitude int)
  (start-longitude int)
  (end-latitude int)
  (end-longitude int)
)
  (let
    (
      (search-data (unwrap! (map-get? search-operations { search-id: search-id }) ERR_SEARCH_NOT_FOUND))
      (current-time (unwrap-panic (get-block-info? time (- block-height u1))))
    )
    ;; Only coordinator can assign volunteers
    (asserts! (is-eq (get coordinator search-data) tx-sender) ERR_UNAUTHORIZED)

    ;; Check if volunteer is already assigned to this search
    (asserts! (is-none (map-get? search-assignments { search-id: search-id, volunteer: volunteer })) ERR_ALREADY_ASSIGNED)

    ;; Create assignment
    (map-set search-assignments
      { search-id: search-id, volunteer: volunteer }
      {
        assigned-area: assigned-area,
        start-latitude: start-latitude,
        start-longitude: start-longitude,
        end-latitude: end-latitude,
        end-longitude: end-longitude,
        assigned-at: current-time,
        status: "assigned",
        progress-notes: ""
      }
    )

    ;; Update volunteer's search list
    (let
      (
        (current-searches (default-to { search-ids: (list) } (map-get? volunteer-searches { volunteer: volunteer })))
        (updated-searches (unwrap-panic (as-max-len? (append (get search-ids current-searches) search-id) u20)))
      )
      (map-set volunteer-searches
        { volunteer: volunteer }
        { search-ids: updated-searches }
      )
    )

    ;; Update search operation volunteer count
    (map-set search-operations
      { search-id: search-id }
      (merge search-data {
        volunteers-assigned: (+ (get volunteers-assigned search-data) u1),
        updated-at: current-time
      })
    )

    (ok true)
  )
)

;; Update search progress
(define-public (update-search-progress
  (search-id uint)
  (progress-notes (string-ascii 200))
  (status (string-ascii 20))
)
  (let
    (
      (assignment (unwrap! (map-get? search-assignments { search-id: search-id, volunteer: tx-sender }) ERR_UNAUTHORIZED))
    )
    ;; Update assignment progress
    (map-set search-assignments
      { search-id: search-id, volunteer: tx-sender }
      (merge assignment {
        progress-notes: progress-notes,
        status: status
      })
    )

    (ok true)
  )
)

;; Complete search operation
(define-public (complete-search-operation (search-id uint))
  (let
    (
      (search-data (unwrap! (map-get? search-operations { search-id: search-id }) ERR_SEARCH_NOT_FOUND))
      (current-time (unwrap-panic (get-block-info? time (- block-height u1))))
    )
    ;; Only coordinator can complete search
    (asserts! (is-eq (get coordinator search-data) tx-sender) ERR_UNAUTHORIZED)

    ;; Update search status
    (map-set search-operations
      { search-id: search-id }
      (merge search-data {
        status: "completed",
        updated-at: current-time
      })
    )

    (ok true)
  )
)

;; Read-only Functions

;; Get search operation details
(define-read-only (get-search-operation (search-id uint))
  (map-get? search-operations { search-id: search-id })
)

;; Get volunteer information
(define-read-only (get-volunteer-info (volunteer-id uint))
  (map-get? volunteers { volunteer-id: volunteer-id })
)

;; Get search assignment
(define-read-only (get-search-assignment (search-id uint) (volunteer principal))
  (map-get? search-assignments { search-id: search-id, volunteer: volunteer })
)

;; Get volunteer's searches
(define-read-only (get-volunteer-searches (volunteer principal))
  (map-get? volunteer-searches { volunteer: volunteer })
)

;; Get next search ID
(define-read-only (get-next-search-id)
  (var-get next-search-id)
)

;; Get next volunteer ID
(define-read-only (get-next-volunteer-id)
  (var-get next-volunteer-id)
)
