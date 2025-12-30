import { Ionicons } from "@expo/vector-icons"; // Íconos estándar de Expo
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

// Definimos los tipos para nuestros ítems de configuración
type SettingsItemProps = {
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress?: () => void;
  isLast?: boolean; // Para quitar el borde al último elemento
};

// Componente reutilizable para cada fila de opción
const SettingsItem = ({
  iconName,
  title,
  subtitle,
  onPress,
  isLast,
}: SettingsItemProps) => (
  <Pressable
    onPress={onPress}
    className={`flex-row items-center p-4 bg-[#1a1a1a] active:opacity-80 ${
      !isLast ? "border-b border-[#4F387F]/30" : ""
    }`}
  >
    {/* Ícono con fondo circular */}
    <View className="w-10 h-10 rounded-full bg-[#4F387F]/40 items-center justify-center mr-4">
      <Ionicons name={iconName} size={20} color="#D8B4FE" />
    </View>

    {/* Textos */}
    <View className="flex-1">
      <Text className="text-lg font-bold tracking-wide text-white font-Helvetica">
        {title}
      </Text>
      <Text className="text-sm text-gray-400 font-Helvetica">{subtitle}</Text>
    </View>

    {/* Flecha a la derecha */}
    <Ionicons name="chevron-forward" size={20} color="#6b7280" />
  </Pressable>
);

const SettingsGame = () => {
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#1C1B1B]">
      {/* HEADER PERSONALIZADO */}
      <View className="z-10 flex-row items-center px-6 pt-12">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-[#4F387F]/20 active:bg-[#4F387F]/40 mr-4"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text className="text-3xl font-black tracking-wider text-white font-Helvetica">
          Configuración
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-6">
        {/* SECCIÓN 1: JUEGO */}
        <Text className="text-[#D8B4FE] font-bold mb-3 ml-2 uppercase tracking-widest text-xs opacity-80">
          Ajustes de Partida
        </Text>
        <View className="mb-8 overflow-hidden shadow-sm rounded-2xl shadow-black/30">
          <SettingsItem
            iconName="alert"
            title="Acciones"
            subtitle="Aun por definir"
            onPress={() => console.log("Ir a tiempos")}
          />
          {/* <SettingsItem
            iconName="people-outline"
            title="Jugadores"
            subtitle="Límites y roles especiales"
            onPress={() => console.log("Ir a jugadores")}
            isLast
          /> */}
        </View>

        {/* SECCIÓN 2: CONTENIDO */}
        <Text className="text-[#D8B4FE] font-bold mb-3 ml-2 uppercase tracking-widest text-xs opacity-80">
          Palabras y Categorías
        </Text>
        <View className="mb-8 overflow-hidden shadow-sm rounded-2xl shadow-black/30">
          <SettingsItem
            iconName="library-outline"
            title="Categorías"
            subtitle="Gestionar packs de palabras"
            onPress={() => router.push("/words_categorys")}
          />
          <SettingsItem
            iconName="list-circle-outline" // O "albums-outline"
            title="Lista de Palabras"
            subtitle="Buscar, filtrar y editar"
            onPress={() => router.push("/words_list")}
          />
          <SettingsItem
            iconName="add-circle-outline"
            title="Añadir Palabras"
            subtitle="Crear tus propias palabras"
            onPress={() => router.push("/add_word")}
            isLast
          />
        </View>

        {/* SECCIÓN 3: GENERAL */}
        <Text className="text-[#D8B4FE] font-bold mb-3 ml-2 uppercase tracking-widest text-xs opacity-80">
          Aplicación
        </Text>
        <View className="mb-12 overflow-hidden shadow-sm rounded-2xl shadow-black/30">
          {/* <SettingsItem
            iconName="volume-high-outline"
            title="Sonido"
            subtitle="Efectos y música de fondo"
            onPress={() => console.log("Ir a sonido")}
          /> */}
          <SettingsItem
            iconName="information-circle-outline"
            title="Acerca de"
            subtitle="Versión 1.0.0"
            onPress={() => console.log("Ir a info")}
            isLast
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsGame;
