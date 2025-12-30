import CategorySkeleton from "@/components/ui/SkeletonCard";
import { useCategories } from "@/hooks/useCategories";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    BackHandler,
    FlatList,
    Pressable,
    RefreshControl,
    Text,
    View,
} from "react-native";
import Animated, {
    FadeIn,
    FadeInDown,
    FadeOut,
    Layout,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

// Componente animado para Pressable
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// 2. COMPONENTE DE TARJETA INDIVIDUAL
const CategoryCard = ({
  item,
  index,
  isSelected,
  isSelectionMode,
  onLongPress,
  onPress,
}: any) => {
  const scale = useSharedValue(1);

  const containerStyle = isSelected
    ? "bg-[#4F387F] border-[#D8B4FE]" // Seleccionado: Morado más claro y borde brillante
    : "bg-[#1a1a1a] border-[#4e387f1c]"; // Normal: Oscuro

  // Animación de pulsación
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedPressable
      entering={FadeInDown.delay(index * 100)
        .springify()
        .damping(100)}
      layout={Layout.springify()}
      onLongPress={onLongPress} // <--- ACTIVAR MODO SELECCIÓN
      onPress={onPress} // <--- SELECCIONAR O NAVEGAR
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
      className="mb-4"
    >
      <View className="bg-[#1a1a1a] rounded-2xl p-4 flex-row items-center shadow-lg shadow-black/40 border border-[#4e387f1c]">
        {/* CHECKMARK VISUAL O ICONO */}
        <View
          className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
            isSelected ? "bg-white" : "bg-[#4F387F]/30"
          }`}
        >
          {isSelected ? (
            <Ionicons name="checkmark" size={24} color="#4F387F" />
          ) : (
            <Ionicons name={item.icon} size={24} color="#D8B4FE" />
          )}
        </View>

        {/* INFO TEXTO */}
        <View className="flex-1">
          <Text className="text-lg font-bold tracking-wide text-white font-Helvetica">
            {item.name}
          </Text>
          <View className="flex-row items-center">
            <Text className="mr-2 text-xs text-gray-400 font-Helvetica">
              {item.count} palabras
            </Text>
            {item.isCustom && (
              <View className="bg-[#D8B4FE]/20 px-2 py-0.5 rounded-full">
                <Text className="text-[#D8B4FE] text-[10px] font-bold">
                  PROPIA
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Si estamos en modo selección y NO está seleccionado, mostramos un círculo vacío */}
        {isSelectionMode && !isSelected && (
          <Ionicons name="ellipse-outline" size={24} color="#6b7280" />
        )}
      </View>
    </AnimatedPressable>
  );
};

// 3. PANTALLA PRINCIPAL
const WordsCategories = () => {
  const router = useRouter();

  const { categories, isLoading, refreshCategories, deleteCategory } =
    useCategories();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const isSelectionMode = selectedIds.length > 0;

  useFocusEffect(
    useCallback(() => {
      // Esto se ejecuta cada vez que la pantalla se vuelve visible
      refreshCategories();

      // (Opcional) Si quisieras limpiar algo al salir de la pantalla, return () => { ... }
    }, [refreshCategories])
  );

  // Manejo del botón "Atrás" físico (Android) para cancelar selección
  useEffect(() => {
    const backAction = () => {
      if (isSelectionMode) {
        setSelectedIds([]);
        return true; // Detiene la acción de salir
      }
      return false; // Permite salir
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, [isSelectionMode]);

  // Lógica del Pull-to-Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshCategories(); // Recarga real desde DB
    setRefreshing(false);
  };

  // LÓGICA DE INTERACCIÓN
  const handleLongPress = (id: number) => {
    if (!selectedIds.includes(id)) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handlePress = (category: any) => {
    if (isSelectionMode) {
      // Si estamos en modo selección, tocar sirve para marcar/desmarcar
      if (selectedIds.includes(category.id)) {
        setSelectedIds(selectedIds.filter((id) => id !== category.id));
      } else {
        setSelectedIds([...selectedIds, category.id]);
      }
    } else {
      // Si NO estamos en modo selección, tocar abre el editor (o detalles)
      handleEditNavigation(category);
    }
  };

  const handleEditNavigation = (category: any) => {
    router.push({
      pathname: "/add_category",
      params: { id: category.id, name: category.name, icon: category.icon },
    });
    setSelectedIds([]); // Limpiar selección al irse
  };

  // Handlers (Aquí conectarás tu lógica más adelante)
  const handleCreate = () => router.push("/add_category");

  const handleEdit = (category: any) => {
    // Pasamos los datos como Query Params
    router.push({
      pathname: "/add_category",
      params: {
        id: category.id,
        name: category.name,
        icon: category.icon,
      },
    });
  };

  // ACCIONES DEL HEADER DE SELECCIÓN
  const handleBulkDelete = () => {
    Alert.alert(
      "Eliminar Categorías",
      `¿Borrar ${selectedIds.length} categorías seleccionadas?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            // Borramos todas las seleccionadas
            // Nota: Podrías optimizar useCategories para recibir un array,
            // pero por ahora hacemos un bucle
            for (const id of selectedIds) {
              await deleteCategory(id);
            }
            setSelectedIds([]); // Salir del modo selección
          },
        },
      ]
    );
  };

  const handleSingleEdit = () => {
    // Buscar el objeto completo de la categoría seleccionada
    const categoryToEdit = categories.find((c) => c.id === selectedIds[0]);
    if (categoryToEdit) {
      handleEditNavigation(categoryToEdit);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "Eliminar Categoría",
      "Esto borrará también todas las palabras que contenga. ¿Estás seguro?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            await deleteCategory(id);
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-[#1C1B1B]">
      {/* ================= HEADER DINÁMICO ================= */}
      <View className="z-10 flex-row items-center justify-between h-32 px-6 pb-6 pt-14">
        {isSelectionMode ? (
          // HEADER MODO SELECCIÓN (Entrada Animada)
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            className="flex-row items-center justify-between flex-1"
          >
            <View className="flex-row items-center gap-4">
              <Pressable onPress={() => setSelectedIds([])} className="p-2">
                <Ionicons name="close" size={28} color="white" />
              </Pressable>
              <Text className="text-xl font-bold text-white font-Helvetica">
                {selectedIds.length} seleccionados
              </Text>
            </View>

            <View className="flex-row gap-4">
              {/* Solo mostrar Editar si hay EXACTAMENTE 1 seleccionado */}
              {selectedIds.length === 1 && (
                <Pressable
                  onPress={handleSingleEdit}
                  className="w-10 h-10 bg-[#4F387F] rounded-full items-center justify-center"
                >
                  <Ionicons name="pencil" size={20} color="white" />
                </Pressable>
              )}
              <Pressable
                onPress={handleBulkDelete}
                className="items-center justify-center w-10 h-10 rounded-full bg-red-500/20"
              >
                <Ionicons name="trash" size={20} color="#ef4444" />
              </Pressable>
            </View>
          </Animated.View>
        ) : (
          // HEADER NORMAL
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            className="flex-row items-center justify-between flex-1"
          >
            <View className="flex-row items-center">
              <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 items-center justify-center rounded-full bg-[#4F387F]/20 mr-4"
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </Pressable>
              <View className="gap-1">
                <Text className="text-3xl font-black tracking-wider text-white font-Helvetica">
                  Categorías
                </Text>
                <Text className="text-xs font-bold tracking-widest text-gray-400 uppercase">
                  Gestionar Palabras
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </View>

      {/* CONTENIDO: SKELETON O LISTA */}
      {isLoading ? (
        // MUESTRA 5 SKELETONS MIENTRAS CARGA
        <View className="p-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <CategorySkeleton key={i} />
          ))}
        </View>
      ) : (
        // MUESTRA LA LISTA REAL CUANDO TERMINA
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          // CONFIGURACIÓN DE REFRESH
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#D8B4FE" // Color del spinner en iOS
              colors={["#D8B4FE"]} // Color del spinner en Android
              progressBackgroundColor="#302347" // Fondo del spinner en Android
            />
          }
          renderItem={({ item, index }) => (
            <CategoryCard
              item={item}
              index={index}
              isSelected={selectedIds.includes(item.id)}
              isSelectionMode={isSelectionMode}
              onLongPress={() => handleLongPress(item.id)}
              onPress={() => handlePress(item)}
            />
          )}
          ListEmptyComponent={
            <View className="items-center justify-center mt-20 opacity-50">
              <Ionicons name="library-outline" size={60} color="white" />
              <Text className="mt-4 font-bold text-white">
                No hay categorías aún
              </Text>
            </View>
          }
        />
      )}

      {/* FAB - Botón Flotante (Se oculta si está cargando para más limpieza, opcional) */}
      {!isLoading && !isSelectionMode && (
        <Pressable
          onPress={handleCreate}
          className="w-16 h-16 bg-[#D8B4FE] absolute bottom-16 right-6 rounded-2xl items-center justify-center shadow-lg shadow-purple-500/20 active:scale-95 transition-transform"
        >
          <Ionicons name="add" size={32} color="#302347" />
        </Pressable>
      )}
    </View>
  );
};

export default WordsCategories;
