# Admin QR Code System Revamp

## Current Problems:
1. Multiple useEffects competing
2. Session redirect logic interferes
3. Waitlist protection might block
4. Step gets changed by various effects

## New Clean System:

### Detection (Component Scope - Before State):
```typescript
const inviteCode = searchParams.get('inviteCode');
const isAdminCode = inviteCode?.startsWith('TCZIOIXWDZLEFQZC');
```

### Initial State (Correct from Start):
```typescript
const [step, setStep] = useState<Step>(
  isAdminCode ? 'usc-welcome' : 'name'
);
```

### Session Check (Skip Admin Codes):
```typescript
if (existingSession && !isAdminCode) {
  // Only redirect non-admin codes
}
```

### Waitlist Protection (Allow Admin Codes):
```typescript
const hasAccess = inviteParam || storedInvite || session;
if (!hasAccess && !isAdminCode) {
  router.push('/waitlist');
}
```

## Implementation Plan:

1. Keep admin detection in component scope ✅ (already done)
2. Add isAdminCode check to session redirect ✅ (already done)
3. Add isAdminCode check to waitlist protection ← MISSING!
4. Remove any other setStep() calls for admin codes

The waitlist protection is the issue!

