export default {
  expo: {
    name: "Hamraah",
    slug: "campool-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "automatic",
    scheme: "hamraah",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#2d6a4f"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yourcompany.hamraah",
      buildNumber: "1.0.0"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#2d6a4f"
      },
      package: "com.musab.hamraah",
      versionCode: 1,
      compileSdkVersion: 34,
      targetSdkVersion: 34,
      permissions: [
        "android.permission.INTERNET",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.VIBRATE",
        "android.permission.WAKE_LOCK",
        "android.permission.ACCESS_BACKGROUND_LOCATION"
      ]
    },
    web: {
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-notifications",
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow Hamraah to use your location to find nearby rides and share your location with other users."
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": "Allow Hamraah to access your camera to take photos for your profile and share images in chat."
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "cd9efcab-af12-4c97-95cc-8fbe3583bdb4"
      },
      EXPO_PUBLIC_API_BASE: "https://campool-l1un.vercel.app"
    }
  }
};
