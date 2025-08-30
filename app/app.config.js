import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the parent directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export default {
  "expo": {
    "name": "INGRD",
    "slug": "ingrd",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "ingrd",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.ingrd.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.ingrd.app",
      "edgeToEdgeEnabled": true
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png",
      "name": "INGRD",
      "shortName": "INGRD"
    },
    "platforms": ["ios", "android", "web"],
    "plugins": [
      "expo-router",
      "expo-localization",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
};