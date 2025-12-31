import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    Alert,
    BackHandler,
    FlatList,
    Pressable,
    RefreshControl,
    Text,
    TextInput,
    View,
} from "react-native";
import Animated, {
    FadeIn,
    FadeInDown,
    Layout,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from "react-native-reanimated";

// Hooks
import { useCategories } from "@/hooks/useCategories";
import { useWords, WordWithCategory } from "@/hooks/useWords";

// --- COMPONENTE: TARJETA DE PALABRA ---
const WordCard = ({
  item,
  isSelected,
  isSelectionMode,
  onLongPress,
  onPress,
}: any) => {
  const scale = useSharedValue(1);

  // Colores según dificultad
  const difficultyColor =
    {
      1: "#4ade80", // Verde
      2: "#facc15", // Amarillo
      3: "#f87171", // Rojo
    }[item.difficulty as 1 | 2 | 3] || "#fff";

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.springify()}
      layout={Layout.springify()}
      style={animatedStyle}
    >
      <Pressable
        onLongPress={onLongPress}
        onPress={() => {
          scale.value = withSpring(
            0.95,
            {},
            () => (scale.value = withSpring(1))
          );
          onPress();
        }}
        className={`mb-3 flex-row items-center p-4 rounded-2xl border ${
          isSelected
            ? "bg-[#4F387F] border-[#D8B4FE]"
            : "bg-[#1a1a1a] border-[#4e387f1c]"
        }`}
      >
        {/* CHECK O ICONO DE CATEGORÍA */}
        <View
          className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
            isSelected ? "bg-white" : "bg-[#4F387F]/20"
          }`}
        >
          {isSelected ? (
            <Ionicons name="checkmark" size={20} color="#4F387F" />
          ) : (
            <Ionicons
              name={(item.category_icon as any) || "help"}
              size={18}
              color="#D8B4FE"
            />
          )}
        </View>

        <View className="flex-1">
          <Text
            className={`font-bold font-Helvetica text-lg ${
              isSelected ? "text-white" : "text-white"
            }`}
          >
            {item.text}
          </Text>
          <Text className="text-xs text-gray-400 font-Helvetica">
            {item.category_name}
          </Text>
        </View>

        {/* INDICADOR DE DIFICULTAD (PUNTO) */}
        <View
          className="w-3 h-3 rounded-full shadow-sm"
          style={{
            backgroundColor: difficultyColor,
            shadowColor: difficultyColor,
            shadowOpacity: 0.5,
            shadowRadius: 4,
          }}
        />
      </Pressable>
    </Animated.View>
  );
};

export default function WordsListScreen() {
  const router = useRouter();

  // 1. DATOS
  const { words, fetchAllWords, deleteWord, isLoading } = useWords();
  const { categories, refreshCategories } = useCategories();

  // 2. ESTADOS DE FILTRO
  const [searchText, setSearchText] = useState("");
  const [selectedCatFilter, setSelectedCatFilter] = useState<number | null>(
    null
  ); // Null = Todos
  const [selectedDiffFilter, setSelectedDiffFilter] = useState<number | null>(
    null
  ); // Null = Todos

  // 3. ESTADOS DE SELECCIÓN / UI
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const isSelectionMode = selectedIds.length > 0;
  const [refreshing, setRefreshing] = useState(false);

  // --- EFECTOS ---
  useFocusEffect(
    useCallback(() => {
      fetchAllWords();
      refreshCategories(); // Traemos categorías para el filtro
      return () => setSelectedIds([]);
    }, [])
  );

  // Back Handler para salir de modo selección
  React.useEffect(() => {
    const backAction = () => {
      if (isSelectionMode) {
        setSelectedIds([]);
        return true;
      }
      return false;
    };
    const bh = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => bh.remove();
  }, [isSelectionMode]);

  // --- LÓGICA DE FILTRADO ---
  const filteredWords = useMemo(() => {
    return words.filter((w) => {
      // 1. Por Categoría
      if (selectedCatFilter !== null && w.category_id !== selectedCatFilter)
        return false;
      // 2. Por Dificultad
      if (selectedDiffFilter !== null && w.difficulty !== selectedDiffFilter)
        return false;
      // 3. Por Texto (Búsqueda)
      if (
        searchText &&
        !w.text.toLowerCase().includes(searchText.toLowerCase())
      )
        return false;

      return true;
    });
  }, [words, selectedCatFilter, selectedDiffFilter, searchText]);

  // --- ACCIONES ---
  const handlePressWord = (word: WordWithCategory) => {
    if (isSelectionMode) {
      toggleSelection(word.id);
    } else {
      // EDITAR: Navegar a add_word pasando params
      router.push({
        pathname: "/add_word",
        params: {
          id: word.id, // Si pasas ID, tu add_word debe detectar que es edición
          text: word.text, // Ojo: en add_word recibes "name" para cat, ajusta para recibir "text" si es palabra
          categoryId: word.category_id,
          difficulty: word.difficulty,
          hint: word.hint,
          // Truco: Pasamos nombres para pre-llenar visualmente si hace falta
          initialCatIcon: word.category_icon,
        },
      });
    }
  };

  const toggleSelection = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = () => {
    Alert.alert("Eliminar", `¿Borrar ${selectedIds.length} palabras?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Borrar",
        style: "destructive",
        onPress: async () => {
          for (const id of selectedIds) await deleteWord(id);
          setSelectedIds([]);
          fetchAllWords(); // Recargar lista
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-[#1C1B1B]">
      {/* HEADER DINÁMICO (Igual que en categorías) */}
      <View className="px-6 pt-14 pb-4 flex-row items-center justify-between z-10 bg-[#1C1B1B]">
        {isSelectionMode ? (
          <Animated.View
            entering={FadeIn}
            className="flex-row items-center justify-between flex-1"
          >
            <View className="flex-row items-center gap-4">
              <Pressable onPress={() => setSelectedIds([])}>
                <Ionicons name="close" size={28} color="white" />
              </Pressable>
              <Text className="text-xl font-bold text-white font-Helvetica">
                {selectedIds.length}
              </Text>
            </View>
            <Pressable
              onPress={handleBulkDelete}
              className="items-center justify-center w-10 h-10 rounded-full bg-red-500/20"
            >
              <Ionicons name="trash" size={20} color="#ef4444" />
            </Pressable>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn} className="flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center rounded-full bg-[#4F387F]/20 mr-4"
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
            <Text className="text-2xl font-black tracking-wider text-white font-Helvetica">
              Diccionario
            </Text>
          </Animated.View>
        )}
      </View>

      {/* --- ZONA DE FILTROS --- */}
      <View className="pb-2">
        {/* BUSCADOR */}
        <View className="px-6 mb-4">
          <View className="bg-[#262626] flex-row items-center px-4 py-2 rounded-2xl border border-[#4F387F]/30">
            <Ionicons name="search" size={20} color="#9ca3af" />
            <TextInput
              placeholder="Buscar palabra..."
              placeholderTextColor="#6b7280"
              value={searchText}
              onChangeText={setSearchText}
              className="flex-1 ml-3 text-base text-white font-Helvetica"
            />
            {searchText.length > 0 && (
              <Pressable onPress={() => setSearchText("")}>
                <Ionicons name="close-circle" size={18} color="#6b7280" />
              </Pressable>
            )}
          </View>
        </View>

        {/* FILTRO CATEGORÍAS (Horizontal) */}
        <View className="mb-4">
          <FlatList
            data={[{ id: -1, name: "Todas", icon: "albums" }, ...categories]} // Dummy "Todas"
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              // -1 representa "Todas" (null en el estado)
              const isAll = item.id === -1;
              const isActive = isAll
                ? selectedCatFilter === null
                : selectedCatFilter === item.id;

              return (
                <Pressable
                  onPress={() => setSelectedCatFilter(isAll ? null : item.id)}
                  className={`mr-2 px-4 py-1 rounded-full flex-row items-center border ${
                    isActive
                      ? "bg-[#D8B4FE] border-[#D8B4FE]"
                      : "bg-[#302347] border-[#4F387F]/30"
                  }`}
                >
                  {item.icon && (
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={isActive ? "#302347" : "#D8B4FE"}
                      style={{ marginRight: 6 }}
                    />
                  )}
                  <Text
                    className={`font-bold ${
                      isActive ? "text-[#302347]" : "text-gray-300"
                    }`}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>

        {/* FILTRO DIFICULTAD (Botones Pequeños) */}
        <View className="flex-row gap-2 px-6 mb-2">
          {[null, 1, 2, 3].map((level) => {
            const labels: any = {
              null: "Todas",
              1: "Fácil",
              2: "Media",
              3: "Difícil",
            };
            const isActive = selectedDiffFilter === level;
            return (
              <Pressable
                key={level || "all"}
                onPress={() => setSelectedDiffFilter(level as any)}
                className={`px-3 py-1 rounded-lg border ${
                  isActive
                    ? "bg-[#4F387F] border-[#D8B4FE]"
                    : "border-transparent"
                }`}
              >
                <Text
                  className={`font-bold ${
                    isActive ? "text-white" : "text-gray-500"
                  }`}
                >
                  {labels[level as any]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* --- LISTA DE PALABRAS --- */}
      <FlatList
        data={filteredWords}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchAllWords();
              setRefreshing(false);
            }}
            tintColor="#D8B4FE"
          />
        }
        renderItem={({ item }) => (
          <WordCard
            item={item}
            isSelected={selectedIds.includes(item.id)}
            isSelectionMode={isSelectionMode}
            onLongPress={() => toggleSelection(item.id)}
            onPress={() => handlePressWord(item)}
          />
        )}
        ListEmptyComponent={
          <View className="items-center justify-center mt-10 opacity-50">
            <Ionicons name="file-tray-outline" size={48} color="white" />
            <Text className="mt-2 text-white font-Helvetica">
              No se encontraron palabras
            </Text>
          </View>
        }
      />
    </View>
  );
}
