import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
    FlatList,
    KeyboardAvoidingView, // Importante
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import Toast from "react-native-toast-message";

import { useCategories } from "@/hooks/useCategories";
import useForm from "@/hooks/useForm";
import { useWords } from "@/hooks/useWords";

export default function AddWordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isEditing = !!params.id;

  const { categories } = useCategories();
  const { addWord, updateWord } = useWords();

  const { form, setForm, text, categoryId, difficulty, hint } = useForm({
    text: params.text ? (params.text as string) : "",
    hint: params.hint ? (params.hint as string) : "",
    categoryId: params.categoryId
      ? Number(params.categoryId)
      : (null as number | null),
    difficulty: params.difficulty
      ? (Number(params.difficulty) as 1 | 2 | 3)
      : (1 as 1 | 2 | 3),
  });

  const handleSave = async () => {
    if (!text || !categoryId) return;

    let result;
    if (isEditing) {
      result = await updateWord(
        Number(params.id),
        text,
        categoryId,
        difficulty,
        hint
      );
    } else {
      result = await addWord(text, categoryId, difficulty, hint);
    }

    if (result.success) {
      if (!isEditing) {
        setForm({ ...form, text: "", hint: "" });
      }

      Toast.show({
        type: "success",
        text1: isEditing ? "¡Actualizado!" : "¡Guardado!",
        text2: isEditing
          ? "La palabra y su pista se han actualizado."
          : "La palabra se ha añadido correctamente.",
        visibilityTime: 2500,
      });

      if (isEditing) router.back();
    } else {
      Toast.show({
        type: "error",
        text1: result.error || "No se pudo realizar la acción",
        visibilityTime: 2500,
      });
    }
  };

  const DifficultyButton = ({ level, label, activeColor }: any) => {
    const isActive = difficulty === level;
    return (
      <Pressable
        onPress={() => setForm({ ...form, difficulty: level })}
        className={`flex-1 py-3 rounded-2xl items-center border-2 mx-1 ${
          isActive ? "bg-opacity-100" : "bg-transparent"
        }`}
        style={{
          borderColor: isActive ? activeColor : "#302347",
          backgroundColor: isActive ? activeColor : "transparent",
        }}
      >
        <Text
          className={`font-bold font-Helvetica ${
            isActive ? "text-[#1C1B1B]" : "text-gray-400"
          }`}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-[#1C1B1B]">
      {/* HEADER (Lo dejamos fuera para que no se mueva) */}
      <View className="flex-row items-center px-6 pb-4 pt-14">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-[#4F387F]/20 active:bg-[#4F387F]/40 mr-4"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text className="text-2xl font-black tracking-wider text-white font-Helvetica">
          {isEditing ? "Editar Palabra" : "Nueva Palabra"}
        </Text>
      </View>

      {/* KEYBOARD AVOIDING VIEW: Envuelve TODO el contenido restante */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        // keyboardVerticalOffset puede ayudar si el header tapa algo, ajusta si es necesario
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <ScrollView
          className="flex-1 px-6 mt-2"
          showsVerticalScrollIndicator={false}
          // 🔥 ESTA ES LA CLAVE: Permite tocar botones aunque el teclado esté abierto
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 100 }} // Espacio extra abajo
        >
          {/* INPUT PALABRA PRINCIPAL */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Text className="text-[#D8B4FE] font-bold mb-2 ml-1 uppercase tracking-widest text-xs">
              Palabra o Frase
            </Text>
            <TextInput
              value={text}
              onChangeText={(val) => setForm({ ...form, text: val })}
              placeholder="Ej: Agujero Negro"
              placeholderTextColor="#6b7280"
              className="bg-[#2626260c] text-white py-3 rounded-2xl font-Helvetica text-xl border border-[#4e387f1c]/50 mb-6 focus:border-[#D8B4FE] text-center font-bold"
              autoFocus={!isEditing}
            />
          </Animated.View>

          {/* INPUT PISTA */}
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <View className="flex-row items-center mb-2 ml-1">
              <Ionicons
                name="bulb-outline"
                size={14}
                color="#facc15"
                style={{ marginRight: 5 }}
              />
              <Text className="text-xs font-bold tracking-widest text-gray-400 uppercase">
                Pista (Ayuda para el Impostor)
              </Text>
            </View>

            <TextInput
              value={hint}
              onChangeText={(val) => setForm({ ...form, hint: val })}
              placeholder="Ej: Es algo que está en el espacio..."
              placeholderTextColor="#555"
              multiline
              maxLength={100}
              className="bg-[#302347]/30 text-gray-200 py-3 px-4 rounded-2xl font-Helvetica text-sm border border-[#4e387f1c]/30 mb-8 focus:border-[#facc15]/50 min-h-[60px]"
              style={{ textAlignVertical: "top" }}
            />
          </Animated.View>

          {/* CATEGORÍAS */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            className="mb-8"
          >
            <Text className="text-[#D8B4FE] font-bold mb-3 ml-1 uppercase tracking-widest text-xs">
              Asignar Categoría
            </Text>

            <View className="h-16">
              <FlatList
                data={categories}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingRight: 20 }}
                // Agregamos esto al FlatList interno también por seguridad
                keyboardShouldPersistTaps="handled"
                renderItem={({ item, index }) => {
                  const isSelected = categoryId === item.id;
                  return (
                    <Animated.View
                      entering={FadeInRight.delay(index * 50).springify()}
                    >
                      <Pressable
                        onPress={() =>
                          setForm({ ...form, categoryId: item.id })
                        }
                        className={`mr-3 px-4 py-2 rounded-full flex-row items-center border ${
                          isSelected
                            ? "bg-[#D8B4FE] border-[#D8B4FE]"
                            : "bg-[#302347] border-[#4F387F]/30"
                        }`}
                      >
                        <Ionicons
                          name={item.icon as any}
                          size={18}
                          color={isSelected ? "#302347" : "#D8B4FE"}
                          style={{ marginRight: 8 }}
                        />
                        <Text
                          className={`font-bold font-Helvetica ${
                            isSelected ? "text-[#302347]" : "text-gray-300"
                          }`}
                        >
                          {item.name}
                        </Text>
                      </Pressable>
                    </Animated.View>
                  );
                }}
                ListEmptyComponent={
                  <Text className="ml-2 italic text-gray-500">
                    No tienes categorías creadas
                  </Text>
                }
              />
            </View>
          </Animated.View>

          {/* DIFICULTAD */}
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            className="mb-8"
          >
            <Text className="text-[#D8B4FE] font-bold mb-3 ml-1 uppercase tracking-widest text-xs">
              Nivel de Dificultad
            </Text>

            <View className="flex-row justify-between bg-[#302347] p-1.5 rounded-2xl">
              <DifficultyButton level={1} label="Fácil" activeColor="#4ade80" />
              <DifficultyButton level={2} label="Medio" activeColor="#facc15" />
              <DifficultyButton
                level={3}
                label="Difícil"
                activeColor="#f87171"
              />
            </View>

            <Text className="mt-3 text-xs text-center text-gray-500 font-Helvetica">
              {difficulty === 1 && "Cualquiera puede adivinarla."}
              {difficulty === 2 && "Requiere algo de conocimiento general."}
              {difficulty === 3 && "Solo para expertos o muy específica."}
            </Text>
          </Animated.View>
        </ScrollView>

        {/* BOTÓN GUARDAR (Ahora dentro del KeyboardAvoidingView) */}
        <View className="p-6 pt-2 pb-6 bg-[#1C1B1B]">
          <Pressable
            onPress={handleSave}
            disabled={!text || !categoryId}
            className={`w-full py-4 rounded-3xl items-center shadow-lg active:scale-95 transition-transform ${
              !text || !categoryId
                ? "bg-[#302347] "
                : "bg-[#D8B4FE] shadow-purple-500/20"
            }`}
          >
            <Text
              className={`font-black text-xl font-Helvetica tracking-wider ${
                !text || !categoryId ? "text-gray-500" : "text-[#302347]"
              }`}
            >
              {isEditing ? "ACTUALIZAR PALABRA" : "GUARDAR PALABRA"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
