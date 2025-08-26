# Phone Number Authentication Implementation Plan

## Executive Summary
Transition from email/password authentication to phone number-based authentication with SMS OTP verification, ensuring seamless compatibility across web and mobile platforms.

## Current State
- **Auth Provider**: Firebase Authentication
- **Current Methods**: Email/password
- **Platforms**: React Native (iOS/Android) + Web
- **Backend**: Node.js with TRPC

## Implementation Strategy

### Phase 1: Infrastructure Setup (Day 1-2)

#### 1.1 Firebase Phone Auth Configuration
```typescript
// Enable Phone Auth in Firebase Console
// Add test phone numbers for development
// Configure reCAPTCHA for web
// Configure App verification for mobile
```

#### 1.2 Platform-Specific Setup

**Web Configuration:**
```typescript
// app/config/firebase.web.ts
import { RecaptchaVerifier } from 'firebase/auth';

export const setupRecaptcha = (buttonId: string) => {
  return new RecaptchaVerifier(buttonId, {
    size: 'invisible',
    callback: (response) => {
      // reCAPTCHA solved
    }
  }, auth);
};
```

**Mobile Configuration:**
```typescript
// app/config/firebase.native.ts
// iOS: Add URL schemes to Info.plist
// Android: Add SHA certificates to Firebase
```

### Phase 2: Component Architecture (Day 3-4)

#### 2.1 Phone Input Component
```typescript
// app/components/ui/PhoneInput/index.tsx
interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  countryCode: string;
  onCountryChange: (code: string) => void;
}

export function PhoneInput({
  value,
  onChangeText,
  countryCode,
  onCountryChange
}: PhoneInputProps) {
  // International phone number formatting
  // Country code selector
  // Validation logic
}
```

#### 2.2 OTP Input Component
```typescript
// app/components/ui/OTPInput/index.tsx
interface OTPInputProps {
  length: number;
  value: string;
  onChange: (otp: string) => void;
  autoFocus?: boolean;
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  autoFocus
}: OTPInputProps) {
  // 6-digit OTP input boxes
  // Auto-advance on input
  // Paste support
  // Backspace handling
}
```

### Phase 3: Authentication Flow (Day 5-6)

#### 3.1 Login/Signup Flow
```typescript
// app/app/(auth)/phone-auth/index.tsx
const PhoneAuthFlow = () => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  
  const sendOTP = async () => {
    try {
      // Web implementation
      if (Platform.OS === 'web') {
        const appVerifier = setupRecaptcha('send-otp-button');
        const confirmation = await signInWithPhoneNumber(
          auth, 
          phoneNumber, 
          appVerifier
        );
        setConfirmationResult(confirmation);
      } 
      // Mobile implementation
      else {
        const confirmation = await signInWithPhoneNumber(
          auth, 
          phoneNumber
        );
        setConfirmationResult(confirmation);
      }
      setStep('otp');
    } catch (error) {
      handleError(error);
    }
  };
  
  const verifyOTP = async (code: string) => {
    try {
      const result = await confirmationResult.confirm(code);
      // User signed in successfully
      await handleUserSignIn(result.user);
    } catch (error) {
      handleError(error);
    }
  };
};
```

#### 3.2 User Creation/Update Flow
```typescript
// server/services/auth/phone-auth.ts
export async function handlePhoneAuth(phoneNumber: string, uid: string) {
  // Check if user exists
  let user = await findUserByPhone(phoneNumber);
  
  if (!user) {
    // Create new user
    user = await createUser({
      uid,
      phoneNumber,
      createdAt: new Date(),
      onboardingCompleted: false
    });
  } else {
    // Update last login
    await updateUserLastLogin(user._id);
  }
  
  return user;
}
```

### Phase 4: Cross-Platform Compatibility (Day 7-8)

#### 4.1 Platform-Specific Implementations

**Web-Specific Features:**
```typescript
// app/lib/auth/phone-auth.web.ts
export const phoneAuth = {
  sendOTP: async (phoneNumber: string) => {
    // Web-specific implementation with reCAPTCHA
  },
  
  resendOTP: async () => {
    // Handle reCAPTCHA reset
  },
  
  setupInvisibleRecaptcha: () => {
    // Initialize invisible reCAPTCHA
  }
};
```

**Native-Specific Features:**
```typescript
// app/lib/auth/phone-auth.native.ts
export const phoneAuth = {
  sendOTP: async (phoneNumber: string) => {
    // Native implementation without reCAPTCHA
  },
  
  handleAutoVerification: () => {
    // iOS/Android auto-verification
  },
  
  requestHint: async () => {
    // Android phone number hint API
  }
};
```

#### 4.2 Unified Interface
```typescript
// app/hooks/usePhoneAuth.ts
export function usePhoneAuth() {
  const platform = Platform.OS;
  
  return {
    sendOTP: async (phoneNumber: string) => {
      return phoneAuth.sendOTP(phoneNumber);
    },
    
    verifyOTP: async (code: string) => {
      // Common verification logic
    },
    
    resendOTP: async () => {
      // Platform-specific resend
    }
  };
}
```

### Phase 5: Migration Strategy (Day 9-10)

#### 5.1 Database Updates
```typescript
// Migration script
interface UserMigration {
  // Add phoneNumber field
  phoneNumber?: string;
  // Keep email as optional
  email?: string;
  // Add phone verification status
  phoneVerified: boolean;
}
```

#### 5.2 Gradual Rollout
1. **Stage 1**: Add phone as optional login method
2. **Stage 2**: Prompt existing users to add phone
3. **Stage 3**: Make phone primary, email secondary
4. **Stage 4**: Phone-only for new users

### Phase 6: Security & Best Practices

#### 6.1 Rate Limiting
```typescript
// server/middleware/rate-limit.ts
export const otpRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 OTP requests per window
  message: 'Too many OTP requests'
};
```

#### 6.2 OTP Security
- 6-digit codes
- 10-minute expiration
- Maximum 3 retry attempts
- Cooldown after failed attempts

#### 6.3 Phone Number Validation
```typescript
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

export function validatePhoneNumber(phone: string, country: string) {
  try {
    if (!isValidPhoneNumber(phone, country)) {
      throw new Error('Invalid phone number');
    }
    
    const parsed = parsePhoneNumber(phone, country);
    return {
      isValid: true,
      formatted: parsed.formatInternational(),
      national: parsed.nationalNumber,
      countryCode: parsed.countryCallingCode
    };
  } catch (error) {
    return { isValid: false };
  }
}
```

## UI/UX Considerations

### Phone Number Entry Screen
```
┌─────────────────────────────┐
│      Welcome Back!          │
│                             │
│   Sign in with your phone   │
│                             │
│  ┌────┐  ┌────────────────┐ │
│  │ +1 │  │ (555) 123-4567 │ │
│  └────┘  └────────────────┘ │
│                             │
│  [ Continue with Phone ]    │
│                             │
│  ─────── or ────────       │
│                             │
│  Continue with Email        │
└─────────────────────────────┘
```

### OTP Verification Screen
```
┌─────────────────────────────┐
│    Verify your number       │
│                             │
│  We sent a code to          │
│  +1 (555) 123-4567         │
│                             │
│  ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐  │
│  │ │ │ │ │ │ │ │ │ │ │ │  │
│  └─┘ └─┘ └─┘ └─┘ └─┘ └─┘  │
│                             │
│  Didn't receive? Resend    │
│  (available in 0:45)        │
│                             │
│  [ Verify Code ]            │
└─────────────────────────────┘
```

## Technical Requirements

### Dependencies
```json
{
  "dependencies": {
    "firebase": "^10.x",
    "libphonenumber-js": "^1.10.x",
    "react-native-otp-textinput": "^1.x",
    "react-phone-number-input": "^3.x"
  }
}
```

### Environment Variables
```env
# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=xxx
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx

# Feature Flags
EXPO_PUBLIC_ENABLE_PHONE_AUTH=true
EXPO_PUBLIC_PHONE_AUTH_TEST_MODE=false

# Test Numbers (dev only)
TEST_PHONE_NUMBER=+15555551234
TEST_OTP_CODE=123456
```

## Testing Strategy

### Unit Tests
- Phone number validation
- OTP input component
- Rate limiting logic

### Integration Tests
- Complete auth flow
- Error scenarios
- Retry mechanisms

### E2E Tests
- Web phone auth flow
- Mobile phone auth flow
- Cross-platform consistency

### Test Scenarios
1. Valid phone number → OTP → Success
2. Invalid phone number → Error
3. Wrong OTP → Retry → Success
4. Rate limit exceeded → Blocked
5. Network failure → Retry
6. Session timeout → Re-authenticate

## Rollback Plan

If issues arise:
1. Feature flag to disable phone auth
2. Fallback to email/password
3. Keep both auth methods active
4. Database rollback script ready

## Success Metrics

- **Conversion Rate**: Target 85% completion rate
- **OTP Delivery**: <5 seconds average
- **Verification Time**: <30 seconds average
- **Error Rate**: <2% failed verifications
- **User Satisfaction**: >4.5/5 rating

## Timeline

| Week | Tasks | Deliverables |
|------|-------|--------------|
| 1 | Infrastructure & Components | Phone/OTP inputs ready |
| 2 | Auth Flow & Backend | Complete auth system |
| 3 | Testing & Migration | Production ready |

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| SMS delivery issues | High | Multiple SMS providers |
| International numbers | Medium | Country restrictions |
| Spam/Abuse | High | Rate limiting & monitoring |
| User privacy concerns | Medium | Clear privacy policy |

## Next Steps

1. Review and approve plan
2. Set up Firebase phone auth
3. Create phone input components
4. Implement auth flow
5. Test across platforms
6. Gradual rollout

---

**Status**: Ready for Implementation
**Priority**: High
**Estimated Time**: 2-3 weeks