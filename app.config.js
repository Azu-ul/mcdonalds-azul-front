module.exports = {
  expo: {
    name: "McDonald's App",
    slug: "front",
    owner: "azulsofia",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.mcdonalds.azul"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.mcdonalds.azul"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "b8cdbf13-522a-40f5-b348-df650a52a7f2"
      }
    },
    scheme: "mcdonalds-azul",
    plugins: [
      "expo-secure-store",
      [
        "expo-build-properties",
        {
          android: {
            kotlinVersion: "1.9.0"
          }
        }
      ]
    ]
  }
};