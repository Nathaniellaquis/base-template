/**
 * Profile validation utilities
 */

export interface ProfileValidationErrors {
  displayName?: string;
  bio?: string;
  phoneNumber?: string;
  location?: string;
  website?: string;
  'socialLinks.twitter'?: string;
  'socialLinks.linkedin'?: string;
  'socialLinks.github'?: string;
  'socialLinks.instagram'?: string;
}

export const profileValidation = {
  displayName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s]+$/,
    message: 'Display name must be 2-50 characters and contain only letters, numbers, and spaces'
  },
  bio: {
    maxLength: 500,
    message: 'Bio must be less than 500 characters'
  },
  phoneNumber: {
    pattern: /^\+?[1-9]\d{1,14}$/,
    message: 'Please enter a valid phone number'
  },
  location: {
    maxLength: 100,
    message: 'Location must be less than 100 characters'
  },
  website: {
    pattern: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    message: 'Please enter a valid URL starting with http:// or https://'
  },
  socialLinks: {
    pattern: /^[a-zA-Z0-9_-]+$/,
    message: 'Username should contain only letters, numbers, underscores, and hyphens'
  }
};

export function validateProfileData(data: any): ProfileValidationErrors {
  const errors: ProfileValidationErrors = {};
  
  // Validate display name
  if (profileValidation.displayName.required && !data.displayName?.trim()) {
    errors.displayName = 'Display name is required';
  } else if (data.displayName) {
    if (data.displayName.length < profileValidation.displayName.minLength) {
      errors.displayName = `Display name must be at least ${profileValidation.displayName.minLength} characters`;
    } else if (data.displayName.length > profileValidation.displayName.maxLength) {
      errors.displayName = `Display name must be less than ${profileValidation.displayName.maxLength} characters`;
    } else if (!profileValidation.displayName.pattern.test(data.displayName)) {
      errors.displayName = profileValidation.displayName.message;
    }
  }
  
  // Validate bio
  if (data.bio && data.bio.length > profileValidation.bio.maxLength) {
    errors.bio = profileValidation.bio.message;
  }
  
  // Validate phone number
  if (data.phoneNumber && !profileValidation.phoneNumber.pattern.test(data.phoneNumber)) {
    errors.phoneNumber = profileValidation.phoneNumber.message;
  }
  
  // Validate location
  if (data.location && data.location.length > profileValidation.location.maxLength) {
    errors.location = profileValidation.location.message;
  }
  
  // Validate website
  if (data.website && !profileValidation.website.pattern.test(data.website)) {
    errors.website = profileValidation.website.message;
  }
  
  // Validate social links
  if (data.socialLinks) {
    const socialPlatforms = ['twitter', 'linkedin', 'github', 'instagram'];
    socialPlatforms.forEach(platform => {
      const value = data.socialLinks[platform];
      if (value && !profileValidation.socialLinks.pattern.test(value)) {
        errors[`socialLinks.${platform}` as keyof ProfileValidationErrors] = profileValidation.socialLinks.message;
      }
    });
  }
  
  return errors;
}