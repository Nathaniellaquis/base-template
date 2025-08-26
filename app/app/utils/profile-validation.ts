/**
 * Profile field validation utilities
 */

type ValidationResult = string | null;
type Validator = (value: any) => ValidationResult;

interface ProfileValidators {
  displayName: Validator;
  bio: Validator;
  phoneNumber: Validator;
  location: Validator;
  website: Validator;
  socialLinks: {
    twitter: Validator;
    linkedin: Validator;
    github: Validator;
    instagram: Validator;
  };
}

export const profileValidation: ProfileValidators = {
  displayName: (value: string): ValidationResult => {
    if (!value || !value.trim()) {
      return 'Display name is required';
    }
    if (value.length > 50) {
      return 'Maximum 50 characters';
    }
    if (!/^[a-zA-Z0-9 ._-]+$/.test(value)) {
      return 'Only letters, numbers, and basic punctuation allowed';
    }
    return null;
  },
  
  bio: (value: string): ValidationResult => {
    if (value && value.length > 500) {
      return 'Maximum 500 characters';
    }
    return null;
  },
  
  phoneNumber: (value: string): ValidationResult => {
    if (value && !/^\+?[1-9]\d{1,14}$/.test(value)) {
      return 'Invalid phone number format (e.g., +1234567890)';
    }
    return null;
  },
  
  location: (value: string): ValidationResult => {
    if (value && value.length > 100) {
      return 'Maximum 100 characters';
    }
    return null;
  },
  
  website: (value: string): ValidationResult => {
    if (value) {
      try {
        new URL(value);
        if (!value.startsWith('http://') && !value.startsWith('https://')) {
          return 'URL must start with http:// or https://';
        }
      } catch {
        return 'Invalid URL format';
      }
    }
    return null;
  },
  
  socialLinks: {
    twitter: (value: string): ValidationResult => {
      if (value && !/^[a-zA-Z0-9_]{1,15}$/.test(value)) {
        return 'Invalid Twitter username (1-15 characters, no @)';
      }
      return null;
    },
    
    linkedin: (value: string): ValidationResult => {
      if (value && !/^[a-zA-Z0-9-]{3,100}$/.test(value)) {
        return 'Invalid LinkedIn username';
      }
      return null;
    },
    
    github: (value: string): ValidationResult => {
      if (value && !/^[a-zA-Z0-9-]{1,39}$/.test(value)) {
        return 'Invalid GitHub username';
      }
      return null;
    },
    
    instagram: (value: string): ValidationResult => {
      if (value && !/^[a-zA-Z0-9_.]{1,30}$/.test(value)) {
        return 'Invalid Instagram username';
      }
      return null;
    },
  },
};

/**
 * Validate all profile fields
 */
export function validateProfileData(data: Record<string, any>): Record<string, string> {
  const errors: Record<string, string> = {};
  
  Object.entries(data).forEach(([field, value]) => {
    if (field === 'socialLinks' && typeof value === 'object') {
      Object.entries(value).forEach(([platform, username]) => {
        const validator = profileValidation.socialLinks[platform as keyof typeof profileValidation.socialLinks];
        if (validator) {
          const error = validator(username);
          if (error) {
            errors[`socialLinks.${platform}`] = error;
          }
        }
      });
    } else {
      const validator = profileValidation[field as keyof typeof profileValidation];
      if (validator && typeof validator === 'function') {
        const error = validator(value);
        if (error) {
          errors[field] = error;
        }
      }
    }
  });
  
  return errors;
}