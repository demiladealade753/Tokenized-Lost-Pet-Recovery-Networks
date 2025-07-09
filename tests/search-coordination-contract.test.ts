import { describe, it, expect, beforeEach } from "vitest"

// Mock contract state
const mockSearchState = {
  searchOperations: new Map(),
  volunteers: new Map(),
  searchAssignments: new Map(),
  volunteerSearches: new Map(),
  nextSearchId: 1,
  nextVolunteerId: 1,
}

// Mock contract functions
const mockSearchContract = {
  createSearchOperation: (
      petId: number,
      searchArea: string,
      centerLatitude: number,
      centerLongitude: number,
      radiusMeters: number,
      volunteersNeeded: number,
      sender: string,
  ) => {
    if (petId <= 0 || !searchArea || volunteersNeeded <= 0) {
      return { error: "ERR_INVALID_DATA" }
    }
    
    const searchId = mockSearchState.nextSearchId
    const currentTime = Date.now()
    
    mockSearchState.searchOperations.set(searchId, {
      petId,
      coordinator: sender,
      searchArea,
      centerLatitude,
      centerLongitude,
      radiusMeters,
      status: "active",
      volunteersNeeded,
      volunteersAssigned: 0,
      createdAt: currentTime,
      updatedAt: currentTime,
    })
    
    mockSearchState.nextSearchId++
    return { success: searchId }
  },
  
  registerVolunteer: (name: string, phone: string, experienceLevel: string, availability: string, sender: string) => {
    if (!name || !phone) {
      return { error: "ERR_INVALID_DATA" }
    }
    
    const volunteerId = mockSearchState.nextVolunteerId
    const currentTime = Date.now()
    
    mockSearchState.volunteers.set(volunteerId, {
      volunteer: sender,
      name,
      phone,
      experienceLevel,
      availability,
      registeredAt: currentTime,
      searchesCompleted: 0,
      rating: 5,
    })
    
    mockSearchState.volunteerSearches.set(sender, [])
    mockSearchState.nextVolunteerId++
    
    return { success: volunteerId }
  },
  
  assignVolunteerToSearch: (
      searchId: number,
      volunteer: string,
      assignedArea: string,
      startLatitude: number,
      startLongitude: number,
      endLatitude: number,
      endLongitude: number,
      sender: string,
  ) => {
    const search = mockSearchState.searchOperations.get(searchId)
    if (!search) {
      return { error: "ERR_SEARCH_NOT_FOUND" }
    }
    
    if (search.coordinator !== sender) {
      return { error: "ERR_UNAUTHORIZED" }
    }
    
    const assignmentKey = `${searchId}-${volunteer}`
    if (mockSearchState.searchAssignments.has(assignmentKey)) {
      return { error: "ERR_ALREADY_ASSIGNED" }
    }
    
    const currentTime = Date.now()
    
    mockSearchState.searchAssignments.set(assignmentKey, {
      assignedArea,
      startLatitude,
      startLongitude,
      endLatitude,
      endLongitude,
      assignedAt: currentTime,
      status: "assigned",
      progressNotes: "",
    })
    
    const volunteerSearches = mockSearchState.volunteerSearches.get(volunteer) || []
    volunteerSearches.push(searchId)
    mockSearchState.volunteerSearches.set(volunteer, volunteerSearches)
    
    search.volunteersAssigned++
    search.updatedAt = currentTime
    
    return { success: true }
  },
  
  updateSearchProgress: (searchId: number, progressNotes: string, status: string, sender: string) => {
    const assignmentKey = `${searchId}-${sender}`
    const assignment = mockSearchState.searchAssignments.get(assignmentKey)
    
    if (!assignment) {
      return { error: "ERR_UNAUTHORIZED" }
    }
    
    assignment.progressNotes = progressNotes
    assignment.status = status
    mockSearchState.searchAssignments.set(assignmentKey, assignment)
    
    return { success: true }
  },
  
  completeSearchOperation: (searchId: number, sender: string) => {
    const search = mockSearchState.searchOperations.get(searchId)
    if (!search) {
      return { error: "ERR_SEARCH_NOT_FOUND" }
    }
    
    if (search.coordinator !== sender) {
      return { error: "ERR_UNAUTHORIZED" }
    }
    
    search.status = "completed"
    search.updatedAt = Date.now()
    
    return { success: true }
  },
  
  getSearchOperation: (searchId: number) => {
    return mockSearchState.searchOperations.get(searchId) || null
  },
  
  getVolunteerInfo: (volunteerId: number) => {
    return mockSearchState.volunteers.get(volunteerId) || null
  },
  
  getSearchAssignment: (searchId: number, volunteer: string) => {
    const assignmentKey = `${searchId}-${volunteer}`
    return mockSearchState.searchAssignments.get(assignmentKey) || null
  },
  
  getVolunteerSearches: (volunteer: string) => {
    return mockSearchState.volunteerSearches.get(volunteer) || []
  },
}

describe("Search Coordination Contract", () => {
  beforeEach(() => {
    mockSearchState.searchOperations.clear()
    mockSearchState.volunteers.clear()
    mockSearchState.searchAssignments.clear()
    mockSearchState.volunteerSearches.clear()
    mockSearchState.nextSearchId = 1
    mockSearchState.nextVolunteerId = 1
  })
  
  describe("createSearchOperation", () => {
    it("should successfully create a search operation", () => {
      const result = mockSearchContract.createSearchOperation(
          1,
          "Central Park Area",
          40.7829,
          -73.9654,
          1000,
          5,
          "coordinator1",
      )
      
      expect(result.success).toBe(1)
      expect(mockSearchState.nextSearchId).toBe(2)
      
      const search = mockSearchContract.getSearchOperation(1)
      expect(search?.petId).toBe(1)
      expect(search?.coordinator).toBe("coordinator1")
      expect(search?.status).toBe("active")
    })
    
    it("should fail with invalid pet ID", () => {
      const result = mockSearchContract.createSearchOperation(
          0, // Invalid pet ID
          "Central Park Area",
          40.7829,
          -73.9654,
          1000,
          5,
          "coordinator1",
      )
      
      expect(result.error).toBe("ERR_INVALID_DATA")
    })
    
    it("should fail with empty search area", () => {
      const result = mockSearchContract.createSearchOperation(
          1,
          "", // Empty search area
          40.7829,
          -73.9654,
          1000,
          5,
          "coordinator1",
      )
      
      expect(result.error).toBe("ERR_INVALID_DATA")
    })
    
    it("should fail with zero volunteers needed", () => {
      const result = mockSearchContract.createSearchOperation(
          1,
          "Central Park Area",
          40.7829,
          -73.9654,
          1000,
          0, // Zero volunteers
          "coordinator1",
      )
      
      expect(result.error).toBe("ERR_INVALID_DATA")
    })
  })
  
  describe("registerVolunteer", () => {
    it("should successfully register a volunteer", () => {
      const result = mockSearchContract.registerVolunteer(
          "John Doe",
          "555-0123",
          "experienced",
          "weekends",
          "volunteer1",
      )
      
      expect(result.success).toBe(1)
      expect(mockSearchState.nextVolunteerId).toBe(2)
      
      const volunteer = mockSearchContract.getVolunteerInfo(1)
      expect(volunteer?.name).toBe("John Doe")
      expect(volunteer?.volunteer).toBe("volunteer1")
    })
    
    it("should fail with empty name", () => {
      const result = mockSearchContract.registerVolunteer(
          "", // Empty name
          "555-0123",
          "experienced",
          "weekends",
          "volunteer1",
      )
      
      expect(result.error).toBe("ERR_INVALID_DATA")
    })
    
    it("should fail with empty phone", () => {
      const result = mockSearchContract.registerVolunteer(
          "John Doe",
          "", // Empty phone
          "experienced",
          "weekends",
          "volunteer1",
      )
      
      expect(result.error).toBe("ERR_INVALID_DATA")
    })
  })
  
  describe("assignVolunteerToSearch", () => {
    beforeEach(() => {
      // Create a search operation and register a volunteer
      mockSearchContract.createSearchOperation(1, "Central Park Area", 40.7829, -73.9654, 1000, 5, "coordinator1")
      
      mockSearchContract.registerVolunteer("John Doe", "555-0123", "experienced", "weekends", "volunteer1")
    })
    
    it("should successfully assign volunteer to search", () => {
      const result = mockSearchContract.assignVolunteerToSearch(
          1,
          "volunteer1",
          "North section of Central Park",
          40.7829,
          -73.9654,
          40.79,
          -73.96,
          "coordinator1",
      )
      
      expect(result.success).toBe(true)
      
      const assignment = mockSearchContract.getSearchAssignment(1, "volunteer1")
      expect(assignment?.assignedArea).toBe("North section of Central Park")
      expect(assignment?.status).toBe("assigned")
      
      const volunteerSearches = mockSearchContract.getVolunteerSearches("volunteer1")
      expect(volunteerSearches).toContain(1)
    })
    
    it("should fail for non-existent search", () => {
      const result = mockSearchContract.assignVolunteerToSearch(
          999, // Non-existent search
          "volunteer1",
          "North section of Central Park",
          40.7829,
          -73.9654,
          40.79,
          -73.96,
          "coordinator1",
      )
      
      expect(result.error).toBe("ERR_SEARCH_NOT_FOUND")
    })
    
    it("should fail for unauthorized coordinator", () => {
      const result = mockSearchContract.assignVolunteerToSearch(
          1,
          "volunteer1",
          "North section of Central Park",
          40.7829,
          -73.9654,
          40.79,
          -73.96,
          "unauthorized_user", // Not the coordinator
      )
      
      expect(result.error).toBe("ERR_UNAUTHORIZED")
    })
    
    it("should fail for already assigned volunteer", () => {
      // First assignment
      mockSearchContract.assignVolunteerToSearch(
          1,
          "volunteer1",
          "North section of Central Park",
          40.7829,
          -73.9654,
          40.79,
          -73.96,
          "coordinator1",
      )
      
      // Second assignment (should fail)
      const result = mockSearchContract.assignVolunteerToSearch(
          1,
          "volunteer1",
          "South section of Central Park",
          40.77,
          -73.97,
          40.775,
          -73.965,
          "coordinator1",
      )
      
      expect(result.error).toBe("ERR_ALREADY_ASSIGNED")
    })
  })
  
  describe("updateSearchProgress", () => {
    beforeEach(() => {
      mockSearchContract.createSearchOperation(1, "Central Park Area", 40.7829, -73.9654, 1000, 5, "coordinator1")
      
      mockSearchContract.registerVolunteer("John Doe", "555-0123", "experienced", "weekends", "volunteer1")
      
      mockSearchContract.assignVolunteerToSearch(
          1,
          "volunteer1",
          "North section of Central Park",
          40.7829,
          -73.9654,
          40.79,
          -73.96,
          "coordinator1",
      )
    })
    
    it("should successfully update search progress", () => {
      const result = mockSearchContract.updateSearchProgress(
          1,
          "Searched 50% of assigned area, no sightings yet",
          "in-progress",
          "volunteer1",
      )
      
      expect(result.success).toBe(true)
      
      const assignment = mockSearchContract.getSearchAssignment(1, "volunteer1")
      expect(assignment?.progressNotes).toBe("Searched 50% of assigned area, no sightings yet")
      expect(assignment?.status).toBe("in-progress")
    })
    
    it("should fail for unassigned volunteer", () => {
      const result = mockSearchContract.updateSearchProgress(
          1,
          "Some progress notes",
          "in-progress",
          "unassigned_volunteer",
      )
      
      expect(result.error).toBe("ERR_UNAUTHORIZED")
    })
  })
  
  describe("completeSearchOperation", () => {
    beforeEach(() => {
      mockSearchContract.createSearchOperation(1, "Central Park Area", 40.7829, -73.9654, 1000, 5, "coordinator1")
    })
    
    it("should successfully complete search operation", () => {
      const result = mockSearchContract.completeSearchOperation(1, "coordinator1")
      
      expect(result.success).toBe(true)
      
      const search = mockSearchContract.getSearchOperation(1)
      expect(search?.status).toBe("completed")
    })
    
    it("should fail for non-existent search", () => {
      const result = mockSearchContract.completeSearchOperation(999, "coordinator1")
      
      expect(result.error).toBe("ERR_SEARCH_NOT_FOUND")
    })
    
    it("should fail for unauthorized user", () => {
      const result = mockSearchContract.completeSearchOperation(1, "unauthorized_user")
      
      expect(result.error).toBe("ERR_UNAUTHORIZED")
    })
  })
})
