# Migration Plan — 100% Typesafe TypeScript

## Step 1: Enable strict mode
Update tsconfig:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

## Step 2: Type all component props
Use interfaces everywhere.

## Step 3: Replace all `any`
Use generics or union types.

## Step 4: Create global type helpers (DTO, API Response)
Example:
```ts
export type ApiResult<T> = { data: T; error?: string };
```

## Step 5: Type all React Query hooks

## Step 6: Type backend contracts
Use shared types where possible.
