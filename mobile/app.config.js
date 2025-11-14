export default {
  expo: {
    name: "Luna Certsys",
    slug: "resare-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/logo.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    scheme: "lunacertsys",
    assetBundlePatterns: ["**/*"],
    splash: {
      image: "./assets/images/splash-logo.png",
      resizeMode: "contain",
      backgroundColor: "#00BFFF"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.ruru18.mobile",
      buildNumber: "1.0.0"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/logo.png",
        backgroundColor: "#ffffff"
      },
      package: "com.ruru18.mobile",
      versionCode: 1,
      permissions: [
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.ACCESS_WIFI_STATE",
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION"
      ],
      config: {
        googleMaps: {
          apiKey: "AIzaSyDd3iUez-1WXYCUd-n_RoLWO_YN8OElRtQ"
        }
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#ffffff"
        }
      ],
      "expo-asset",
      "expo-font"
    ]
  }
};