import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "../global.css";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import * as NavigationBar from "expo-navigation-bar";
import { SQLiteProvider } from "expo-sqlite";
import { Platform, View } from "react-native";
import { initializeDatabase } from "../assets/utils/database";

import { Ionicons } from "@expo/vector-icons";
import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "index",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    HelveticaNowDisplayRegular: require("../assets/fonts/HelveticaNowDisplay-Regular.ttf"),
  });

  const toastConfig = {
    /* === ÉXITO (Happy Path) === */
    success: (props: any) => (
      <BaseToast
        {...props}
        style={{
           borderLeftWidth: 1,
          borderLeftColor: "#4F387F", // Barra lateral roja
          backgroundColor: "#302347", // Tu color oscuro secundario
          borderRadius: 50, // Súper redondeado (estilo Burnt)
          height: 60,
          width: "90%", // Flotante (no ocupa todo el ancho)
          borderColor: "#4F387F", // Borde sutil
          borderWidth: 1,
          // Sombra suave para profundidad
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 8,
        }}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        text1Style={{
          fontSize: 16,
          fontWeight: "900",
          color: "#fff", // Título blanco
          fontFamily: "Helvetica", // Tu fuente
        }}
        text2Style={{
          fontSize: 13,
          color: "#D8B4FE", // Subtítulo en tu morado claro
        }}
        // Renderizamos un ICONO bonito a la izquierda
        renderLeadingIcon={() => (
          <View className="items-center justify-center h-full pl-4">
            <View className="bg-[#D8B4FE] w-7 h-7 rounded-full items-center justify-center">
              <Ionicons name="checkmark" size={16} color="#302347" />
            </View>
          </View>
        )}
      />
    ),

    /* === ERROR (Sad Path) === */
    error: (props: any) => (
      <ErrorToast
        {...props}
        style={{
          borderLeftWidth: 1,
          borderLeftColor: "#fca5a5", // Barra lateral roja
          backgroundColor: "#302347",
          borderRadius: 25,
          height: 50,
          width: "90%",
          borderColor: "#fca5a5", // Borde Rojo
          borderWidth: 1,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 8,
        }}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        text1Style={{
          fontSize: 16,
          fontWeight: "900",
          color: "#fff",
          fontFamily: "Helvetica",
        }}
        text2Style={{
          fontSize: 13,
          color: "#fca5a5", // Rojo claro
        }}
        renderLeadingIcon={() => (
          <View className="items-center justify-center h-full pl-4">
            <View className="items-center justify-center bg-red-500 rounded-full w-7 h-7">
              <Ionicons name="alert" size={16} color="white" />
            </View>
          </View>
        )}
      />
    ),
  };

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync("#1C1B1B");
      NavigationBar.setButtonStyleAsync("light");
    }
  }, []);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <SQLiteProvider databaseName="imposter.db" onInit={initializeDatabase}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          
          <Stack.Screen name="setup_game" options={{ headerShown: false }} />
          <Stack.Screen name="role_pass" options={{ headerShown: false }} />
          <Stack.Screen name="game_room" options={{ headerShown: false }} />

          <Stack.Screen name="settings_game" options={{ headerShown: false }} />
          <Stack.Screen
            name="words_categorys"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="add_word" options={{ headerShown: false }} />
          <Stack.Screen name="add_category" options={{ headerShown: false }} />
          <Stack.Screen name="words_list" options={{ headerShown: false }} />

          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
        </Stack>
        <StatusBar style="auto" />
      </SQLiteProvider>
      <Toast config={toastConfig} />
    </ThemeProvider>
  );
}
