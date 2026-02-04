# Health Check Integration

This document describes how the health check service has been integrated into the admin reports service.

## Overview

The health check endpoint (`/health-check/`) has been integrated into the admin reports service, allowing admin users to check the API health status.

## Changes Made

### 1. API Configuration (`src/config/api.ts`)
Added a new `HEALTH` endpoint configuration:
```typescript
HEALTH: {
  CHECK: '/health-check/',
}
```

### 2. Type Definitions (`src/features/admin-reports/types/index.ts`)
Added the `HealthCheckResponse` interface:
```typescript
export interface HealthCheckResponse {
  status: string
}
```

### 3. Admin Report Service (`src/services/api/admin-reports/adminReportService.ts`)
Added the `getHealthCheck` method:
```typescript
getHealthCheck: async (signal?: AbortSignal): Promise<HealthCheckResponse> => {
  // Fetches health status from /health-check/ endpoint
}
```

### 4. Admin Reports Store (`src/store/adminReportsStore.ts`)
Added health check state and actions:
- **State:**
  - `healthCheck: HealthCheckResponse | null` - Health check data
  - `isHealthCheckLoading: boolean` - Loading state for health check
  - `healthCheckError: string | null` - Error state for health check

- **Actions:**
  - `fetchHealthCheck(signal?: AbortSignal)` - Fetch health check status
  - `clearHealthCheck()` - Clear health check data
  - `clearHealthCheckError()` - Clear health check error

## Usage Example

### In a React Component

```typescript
import { useAdminReportsStore } from '@store/adminReportsStore'
import { useEffect, useRef } from 'react'

const MyComponent = () => {
  const { 
    healthCheck, 
    isHealthCheckLoading, 
    healthCheckError, 
    fetchHealthCheck,
    clearHealthCheckError 
  } = useAdminReportsStore()
  
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // Create abort controller for request cancellation
    abortControllerRef.current = new AbortController()
    
    // Fetch health check
    fetchHealthCheck(abortControllerRef.current.signal)
    
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchHealthCheck])

  if (isHealthCheckLoading) {
    return <div>Checking API health...</div>
  }

  if (healthCheckError) {
    return <div>Error: {healthCheckError}</div>
  }

  if (healthCheck) {
    return <div>API Status: {healthCheck.status}</div>
  }

  return null
}
```

### Direct Service Usage

```typescript
import { adminReportService } from '@services/api/admin-reports/adminReportService'

// Fetch health check
const healthStatus = await adminReportService.getHealthCheck()
console.log('API Status:', healthStatus.status) // Expected: "ok"
```

## API Response

The health check endpoint returns:
```json
{
  "status": "ok"
}
```

## Features

- **Request Cancellation**: Supports AbortSignal for cancelling in-flight requests
- **Race Condition Prevention**: Uses request counters to prevent race conditions
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Separate loading state for health check operations
- **Type Safety**: Fully typed with TypeScript interfaces

## Integration Points

The health check can be used in:
- Admin dashboard pages to verify API connectivity
- System status monitoring components
- Health monitoring dashboards
- Automated health checks before critical operations

