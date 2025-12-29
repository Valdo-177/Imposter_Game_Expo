import { useCategories } from "@/hooks/useCategories";
import useForm from "@/hooks/useForm";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { SlideInDown } from "react-native-reanimated";

// 1. LISTA CURADA DE ICONOS (Para que el buscador tenga sentido)
// Puedes agregar todos los que quieras de Ionicons aquí.
const AVAILABLE_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  "paw",
  "medkit",
  "videocam",
  "globe",
  "people",
  "fast-food",
  "game-controller",
  "football",
  "airplane",
  "beaker",
  "book",
  "bulb",
  "car",
  "cart",
  "construct",
  "diamond",
  "earth",
  "film",
  "fitness",
  "flask",
  "flower",
  "gift",
  "glasses",
  "hammer",
  "heart",
  "home",
  "hourglass",
  "ice-cream",
  "key",
  "leaf",
  "library",
  "map",
  "mic",
  "musical-notes",
  "nutrition",
  "pizza",
  "planet",
  "rocket",
  "rose",
  "school",
  "shirt",
  "skull",
  "snow",
  "star",
  "telescope",
  "thunderstorm",
  "train",
  "trophy",
  "umbrella",
  "wallet",
  "wifi",
  "wine",
  "american-football",
];

export default function AddCategoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isEditing = !!params.id; // Si hay ID, estamos editando

  const { addCategory, updateCategory } = useCategories();

  const { form, setForm, name, icon } = useForm({
    name: params.name ? (params.name as string) : "",
    icon: params.icon
      ? (params.icon as keyof typeof Ionicons.glyphMap)
      : "cube",
  });

  // Estados del Modal de Iconos
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Filtrar iconos según búsqueda
  const filteredIcons = AVAILABLE_ICONS.filter((icon) =>
    icon.includes(searchText.toLowerCase())
  );

  const handleSave = async () => {
    if (name.trim() === "") return;

    let success = false;

    if (isEditing) {
      // ACTUALIZAR
      success = await updateCategory(Number(params.id), form.name, form.icon);
    } else {
      // CREAR
      success = await addCategory(form.name, form.icon);
    }

    if (success) {
      router.back();
    }
  };

  return (
    <View className="flex-1 bg-[#1C1B1B]">
      {/* HEADER SIMPLE */}
      <View className="flex-row items-center px-6 pb-4 pt-14">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-[#4F387F]/20 active:bg-[#4F387F]/40 mr-4"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text className="text-2xl font-black tracking-wider text-white font-Helvetica">
          {isEditing ? "Editar Categoría" : "Nueva Categoría"}
        </Text>
      </View>

      <View className="flex-1 px-6 mt-6">
        {/* INPUT: NOMBRE */}
        <Text className="text-[#D8B4FE] font-bold mb-2 ml-1 uppercase tracking-widest text-xs">
          Nombre de la Categoría
        </Text>
        <TextInput
          value={name}
          onChangeText={(text) => setForm({ ...form, name: text })}
          placeholder="Ej: Deportes Extremos"
          placeholderTextColor="#6b7280"
          className="bg-[#2626260c] text-white p-4 rounded-2xl font-Helvetica text-lg border border-[#4e387f1c]/50 mb-8 focus:border-[#D8B4FE]"
        />

        {/* SELECTOR DE ICONO */}
        <Text className="text-[#D8B4FE] font-bold mb-2 ml-1 uppercase tracking-widest text-xs">
          Icono Representativo
        </Text>
        <Pressable
          onPress={() => setModalVisible(true)}
          className="bg-[#302347] rounded-2xl p-4 flex-row items-center justify-between border border-[#4F387F]/50 active:bg-[#4F387F]/30"
        >
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-[#4F387F] items-center justify-center mr-4 shadow-lg shadow-purple-500/30">
              <Ionicons name={form.icon} size={24} color="white" />
            </View>
            <View>
              <Text className="text-lg font-bold text-white capitalize font-Helvetica">
                {form.icon}
              </Text>
              <Text className="text-xs text-gray-400">Toca para cambiar</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6b7280" />
        </Pressable>
      </View>

      {/* BOTÓN GUARDAR (Fixed Bottom) */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="p-6">
          <Pressable
            onPress={handleSave}
            className="w-full bg-[#D8B4FE] py-4 rounded-3xl items-center shadow-lg shadow-purple-500/20 active:scale-95 transition-transform"
          >
           <Text className="text-[#302347] font-black text-xl font-Helvetica tracking-wider">
              {isEditing ? "ACTUALIZAR" : "CREAR CATEGORÍA"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* ======================================================= */}
      {/* MODAL SELECCIONADOR DE ICONOS */}
      {/* ======================================================= */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="justify-end flex-1 bg-black/80">
          {/* Contenido del Modal (Animado hacia arriba) */}
          <Animated.View
            entering={SlideInDown.springify().damping(100)}
            className="bg-[#1C1B1B] h-[80%] rounded-t-[40px] overflow-hidden"
          >
            {/* Barra superior del modal (Grabber) */}
            <View className="items-center pt-4 pb-2">
              <View className="w-16 h-1.5 bg-gray-600 rounded-full" />
            </View>

            <View className="flex-row items-center justify-between px-6 pb-4">
              <Text className="text-xl font-bold text-white font-Helvetica">
                Seleccionar Icono
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Text className="text-[#D8B4FE] font-bold">Cerrar</Text>
              </Pressable>
            </View>

            {/* BUSCADOR DE ICONOS */}
            <View className="px-6 mb-4">
              <View className="bg-[#2626260c] flex-row items-center px-4 py-1 rounded-xl border border-[#4e387f1c]/30">
                <Ionicons name="search" size={20} color="#9ca3af" />
                <TextInput
                  placeholder="Buscar (ej: heart, game...)"
                  placeholderTextColor="#6b7280"
                  className="flex-1 ml-3 text-white font-Helvetica"
                  value={searchText}
                  onChangeText={setSearchText}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* GRILLA DE ICONOS */}
            <FlatList
              data={filteredIcons}
              keyExtractor={(item) => item}
              numColumns={4}
              contentContainerStyle={{
                paddingBottom: 40,
                paddingHorizontal: 20,
              }}
              columnWrapperStyle={{
                justifyContent: "space-between",
                marginBottom: 20,
              }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setForm({ ...form, icon: item });
                    setModalVisible(false);
                    setSearchText("");
                  }}
                  className="items-center justify-center w-[22%]"
                >
                  <View
                    className={`w-16 h-16 rounded-2xl items-center justify-center mb-2 ${
                      form.icon === item ? "bg-[#d8b4fe]" : "bg-[#251b368a]"
                    }`}
                  >
                    <Ionicons
                      name={item}
                      size={28}
                      color={form.icon === item ? "#251b36" : "#D8B4FE"}
                    />
                  </View>
                  <Text
                    className="text-gray-400 text-[10px] text-center capitalize"
                    numberOfLines={1}
                  >
                    {item}
                  </Text>
                </Pressable>
              )}
            />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
