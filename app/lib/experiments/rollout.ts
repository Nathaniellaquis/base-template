/**
 * Feature Rollout Utilities
 * Progressive rollout and feature management
 */
import { getAnalyticsInstance } from '@/lib/analytics/tracking';

/**
 * Rollout configuration
 */
export interface RolloutConfig {
  featureKey: string;
  percentage: number; // 0-100
  enabledSegments?: string[];
  disabledSegments?: string[];
  userOverrides?: {
    enabled: string[];
    disabled: string[];
  };
  startDate?: Date;
  endDate?: Date;
}

/**
 * Check if a user is in a rollout
 */
export function isUserInRollout(userId: string, config: RolloutConfig): boolean {
  // Check explicit overrides
  if (config.userOverrides?.enabled?.includes(userId)) {
    return true;
  }
  if (config.userOverrides?.disabled?.includes(userId)) {
    return false;
  }
  
  // Check date range
  const now = new Date();
  if (config.startDate && now < config.startDate) {
    return false;
  }
  if (config.endDate && now > config.endDate) {
    return false;
  }
  
  // Use deterministic hash for consistent rollout
  const hash = hashUserId(userId);
  const bucket = hash % 100;
  
  return bucket < config.percentage;
}

/**
 * Simple hash function for deterministic rollout
 */
function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Progressive rollout manager
 */
export class RolloutManager {
  private configs: Map<string, RolloutConfig> = new Map();
  
  /**
   * Set rollout configuration
   */
  setRollout(config: RolloutConfig): void {
    this.configs.set(config.featureKey, config);
  }
  
  /**
   * Get rollout configuration
   */
  getRollout(featureKey: string): RolloutConfig | undefined {
    return this.configs.get(featureKey);
  }
  
  /**
   * Check if feature is enabled for user
   */
  isEnabled(featureKey: string, userId: string): boolean {
    const config = this.configs.get(featureKey);
    if (!config) {
      return false;
    }
    
    return isUserInRollout(userId, config);
  }
  
  /**
   * Increase rollout percentage
   */
  increaseRollout(featureKey: string, newPercentage: number): void {
    const config = this.configs.get(featureKey);
    if (config && newPercentage > config.percentage && newPercentage <= 100) {
      config.percentage = newPercentage;
      this.trackRolloutChange(featureKey, config.percentage, newPercentage);
    }
  }
  
  /**
   * Decrease rollout percentage
   */
  decreaseRollout(featureKey: string, newPercentage: number): void {
    const config = this.configs.get(featureKey);
    if (config && newPercentage < config.percentage && newPercentage >= 0) {
      config.percentage = newPercentage;
      this.trackRolloutChange(featureKey, config.percentage, newPercentage);
    }
  }
  
  /**
   * Kill switch - immediately disable feature
   */
  killSwitch(featureKey: string): void {
    const config = this.configs.get(featureKey);
    if (config) {
      const previousPercentage = config.percentage;
      config.percentage = 0;
      this.trackKillSwitch(featureKey, previousPercentage);
    }
  }
  
  /**
   * Full rollout - enable for all users
   */
  fullRollout(featureKey: string): void {
    const config = this.configs.get(featureKey);
    if (config) {
      const previousPercentage = config.percentage;
      config.percentage = 100;
      this.trackFullRollout(featureKey, previousPercentage);
    }
  }
  
  /**
   * Track rollout changes
   */
  private trackRolloutChange(featureKey: string, oldPercentage: number, newPercentage: number): void {
    const analytics = getAnalyticsInstance();
    analytics?.capture('feature_rollout_changed', {
      feature: featureKey,
      old_percentage: oldPercentage,
      new_percentage: newPercentage,
      timestamp: new Date().toISOString(),
    });
  }
  
  /**
   * Track kill switch activation
   */
  private trackKillSwitch(featureKey: string, previousPercentage: number): void {
    const analytics = getAnalyticsInstance();
    analytics?.capture('feature_kill_switch_activated', {
      feature: featureKey,
      previous_percentage: previousPercentage,
      timestamp: new Date().toISOString(),
    });
  }
  
  /**
   * Track full rollout
   */
  private trackFullRollout(featureKey: string, previousPercentage: number): void {
    const analytics = getAnalyticsInstance();
    analytics?.capture('feature_full_rollout', {
      feature: featureKey,
      previous_percentage: previousPercentage,
      timestamp: new Date().toISOString(),
    });
  }
}

// Export singleton instance
export const rolloutManager = new RolloutManager();

/**
 * Rollout strategies
 */
export const RolloutStrategies = {
  /**
   * Gradual rollout - increase by fixed percentage over time
   */
  gradual: (startPercentage: number = 10, increment: number = 10, intervalDays: number = 7): RolloutConfig[] => {
    const configs: RolloutConfig[] = [];
    let currentPercentage = startPercentage;
    let currentDate = new Date();
    
    while (currentPercentage <= 100) {
      configs.push({
        featureKey: '',
        percentage: currentPercentage,
        startDate: new Date(currentDate),
      });
      
      currentPercentage += increment;
      currentDate.setDate(currentDate.getDate() + intervalDays);
    }
    
    return configs;
  },
  
  /**
   * Canary rollout - start very small and increase exponentially
   */
  canary: (): RolloutConfig[] => {
    return [
      { featureKey: '', percentage: 1 },    // Day 1: 1%
      { featureKey: '', percentage: 5 },    // Day 3: 5%
      { featureKey: '', percentage: 10 },   // Day 5: 10%
      { featureKey: '', percentage: 25 },   // Day 7: 25%
      { featureKey: '', percentage: 50 },   // Day 10: 50%
      { featureKey: '', percentage: 100 },  // Day 14: 100%
    ];
  },
  
  /**
   * Blue-green rollout - instant switch
   */
  blueGreen: (): RolloutConfig[] => {
    return [
      { featureKey: '', percentage: 0 },    // Blue (old)
      { featureKey: '', percentage: 100 },  // Green (new)
    ];
  },
  
  /**
   * Ring rollout - roll out to specific user segments
   */
  ring: (rings: Array<{ segment: string; percentage: number }>): RolloutConfig[] => {
    return rings.map(ring => ({
      featureKey: '',
      percentage: ring.percentage,
      enabledSegments: [ring.segment],
    }));
  },
};