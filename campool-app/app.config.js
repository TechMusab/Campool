export default {
  expo: {
    name: "Hamraah",
    slug: "hamraah",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "light",
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
      package: "com.yourcompany.hamraah",
      versionCode: 1,
      permissions: [
        "android.permission.INTERNET",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.VIBRATE",
        "android.permission.WAKE_LOCK"
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
      }
    }
  }
};
