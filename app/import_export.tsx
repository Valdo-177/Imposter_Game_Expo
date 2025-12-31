import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View
} from "react-native";
import Toast from "react-native-toast-message";

import { useCategories } from "@/hooks/useCategories"; // <--- Importamos categorías
import { useWords } from "@/hooks/useWords";

export default function ImportExportScreen() {
  const router = useRouter();
  const { importWordsFromJson, exportWordsAsJson } = useWords();
  const { categories } = useCategories(); // Traemos las categorías para listar

  const [mode, setMode] = useState<"text" | "file">("text");
  const [jsonText, setJsonText] = useState("");
  const [loading, setLoading] = useState(false);

  // Estado para selección múltiple de categorías a exportar
  const [selectedCatsToExport, setSelectedCatsToExport] = useState<number[]>(
    []
  );

  // --- LÓGICA DE SELECCIÓN ---
  const toggleCategory = (id: number) => {
    if (selectedCatsToExport.includes(id)) {
      setSelectedCatsToExport((prev) => prev.filter((c) => c !== id));
    } else {
      setSelectedCatsToExport((prev) => [...prev, id]);
    }
  };

  const selectAll = () => {
    if (selectedCatsToExport.length === categories.length) {
      setSelectedCatsToExport([]); // Deseleccionar todo
    } else {
      setSelectedCatsToExport(categories.map((c) => c.id)); // Seleccionar todo
    }
  };

  // --- IMPORTAR TEXTO ---
  const handleImportText = async () => {
    if (!jsonText.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    const result = await importWordsFromJson(jsonText);
    setLoading(false);
    handleResult(result);
  };

  // --- IMPORTAR ARCHIVO (CORREGIDO PARA ANDROID) ---
  const handleImportFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        // TRUCO: Algunos Androids no reconocen application/json, usamos */* para forzar
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (res.canceled) return;

      const fileUri = res.assets[0].uri;

      // Validación extra por si seleccionan una imagen o algo raro
      if (!res.assets[0].name.endsWith(".json")) {
        Toast.show({
          type: "error",
          text1: "Archivo inválido",
          text2: "Debe ser un archivo .json",
        });
        return;
      }

      setLoading(true);
      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      const result = await importWordsFromJson(fileContent);
      setLoading(false);
      handleResult(result);
    } catch (error) {
      setLoading(false);
      Toast.show({ type: "error", text1: "Error al leer el archivo" });
    }
  };

  // --- EXPORTAR SELECCIÓN ---
  const handleExport = async () => {
    if (selectedCatsToExport.length === 0) {
      Toast.show({
        type: "info",
        text1: "Selecciona categorías",
        text2: "Debes elegir qué exportar.",
      });
      return;
    }
    setLoading(true);
    // Pasamos los IDs seleccionados
    const result = await exportWordsAsJson(selectedCatsToExport);
    setLoading(false);

    if (!result.success && result.error) {
      Toast.show({ type: "error", text1: "Error", text2: result.error });
    }
  };

  const handleResult = (result: any) => {
    if (result.success) {
      Toast.show({
        type: "success",
        text1: "¡Importación Exitosa!",
        text2: `Nuevas: ${result.count} | Actualizadas: ${result.updated || 0}`,
      });
      setJsonText("");
    } else {
      Toast.show({
        type: "error",
        text1: "Error de Importación",
        text2: result.error,
      });
    }
  };

  return (
    <View className="flex-1 bg-[#1C1B1B]">
      {/* HEADER */}
      <View className="flex-row items-center px-6 pb-4 pt-14 border-b border-[#4F387F]/20">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-[#4F387F]/20 active:bg-[#4F387F]/40 mr-4"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text className="text-2xl font-black tracking-wider text-white font-Helvetica">
          Data Pack
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1 px-6 pt-6"
          keyboardShouldPersistTaps="handled"
        >
          {/* === SECCIÓN 1: EXPORTAR (Por Categorías) === */}
          <View className="mb-8 p-4 bg-[#302347] rounded-3xl border border-[#4F387F]/50">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Ionicons
                  name="share-social-outline"
                  size={22}
                  color="#D8B4FE"
                />
                <Text className="ml-2 text-lg font-bold text-white font-Helvetica">
                  Exportar Pack
                </Text>
              </View>
              <Pressable onPress={selectAll}>
                <Text className="text-[#D8B4FE] text-xs font-bold uppercase">
                  {selectedCatsToExport.length === categories.length
                    ? "Ninguna"
                    : "Todas"}
                </Text>
              </Pressable>
            </View>

            <Text className="mb-4 text-xs text-gray-400">
              Selecciona las categorías que quieres incluir en el archivo .json
            </Text>

            {/* LISTA DE CATEGORÍAS (Horizontal para ahorrar espacio) */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              {categories.map((cat) => {
                const isSelected = selectedCatsToExport.includes(cat.id);
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => toggleCategory(cat.id)}
                    className={`px-3 py-2 rounded-xl border flex-row items-center ${
                      isSelected
                        ? "bg-[#D8B4FE] border-[#D8B4FE]"
                        : "bg-[#1C1B1B] border-[#4F387F]/30"
                    }`}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={14}
                      color={isSelected ? "#302347" : "#D8B4FE"}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? "text-[#302347]" : "text-gray-300"
                      }`}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={handleExport}
              className={`py-3 rounded-xl items-center ${
                selectedCatsToExport.length > 0 ? "bg-[#D8B4FE]" : "bg-gray-600"
              }`}
              disabled={selectedCatsToExport.length === 0}
            >
              {loading ? (
                <ActivityIndicator color="#302347" />
              ) : (
                <Text className="text-[#302347] font-bold font-Helvetica">
                  EXPORTAR SELECCIÓN ({selectedCatsToExport.length})
                </Text>
              )}
            </Pressable>
          </View>

          {/* === SECCIÓN 2: IMPORTAR === */}
          <Text className="text-[#D8B4FE] font-bold mb-4 uppercase tracking-widest text-xs">
            Importar Pack
          </Text>

          {/* Tabs Selector */}
          <View className="flex-row mb-6 bg-[#262626] p-1 rounded-xl">
            <Pressable
              onPress={() => setMode("text")}
              className={`flex-1 py-2 rounded-lg items-center ${
                mode === "text" ? "bg-[#4F387F]" : "bg-transparent"
              }`}
            >
              <Text
                className={`font-bold ${
                  mode === "text" ? "text-white" : "text-gray-500"
                }`}
              >
                Texto Manual
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMode("file")}
              className={`flex-1 py-2 rounded-lg items-center ${
                mode === "file" ? "bg-[#4F387F]" : "bg-transparent"
              }`}
            >
              <Text
                className={`font-bold ${
                  mode === "file" ? "text-white" : "text-gray-500"
                }`}
              >
                Archivo JSON
              </Text>
            </Pressable>
          </View>

          {mode === "text" ? (
            <View>
              <TextInput
                value={jsonText}
                onChangeText={setJsonText}
                multiline
                numberOfLines={10}
                placeholder='[{"text": "Palabra", "category_name": "Cine", "hint": "Pista..."}]'
                placeholderTextColor="#555"
                className="bg-[#262626] text-white p-4 rounded-xl border border-[#4F387F]/30 font-mono text-xs h-48"
                style={{ textAlignVertical: "top" }}
              />
              <Pressable
                onPress={handleImportText}
                disabled={!jsonText.trim() || loading}
                className={`mt-4 py-4 rounded-2xl items-center ${
                  !jsonText.trim() ? "bg-[#302347]" : "bg-[#D8B4FE]"
                }`}
              >
                {loading ? (
                  <ActivityIndicator color="#302347" />
                ) : (
                  <Text
                    className={`font-black ${
                      !jsonText.trim() ? "text-gray-500" : "text-[#302347]"
                    }`}
                  >
                    IMPORTAR AHORA
                  </Text>
                )}
              </Pressable>
            </View>
          ) : (
            <View className="items-center justify-center bg-[#262626] border-2 border-dashed border-[#4F387F]/50 rounded-2xl h-48">
              <Ionicons
                name="document-text-outline"
                size={48}
                color="#4F387F"
              />
              <Text className="px-10 mt-2 text-xs text-center text-gray-400">
                Selecciona el archivo .json de tu copia de seguridad
              </Text>
              <Pressable
                onPress={handleImportFile}
                className="mt-4 bg-[#D8B4FE] px-6 py-2 rounded-xl"
              >
                {loading ? (
                  <ActivityIndicator color="#302347" />
                ) : (
                  <Text className="text-[#302347] font-bold text-xs">
                    ABRIR ARCHIVOS
                  </Text>
                )}
              </Pressable>
            </View>
          )}

          <View className="h-20" />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
