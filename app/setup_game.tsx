import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    Text,
    View,
} from "react-native";
import DraggableFlatList, {
    RenderItemParams,
} from "react-native-draggable-flatlist";
import Animated, { FadeInDown } from "react-native-reanimated";

// Hooks y Componentes
import { DraggablePlayerItem } from "@/components/ui/DraggablePlayerItem";
import { useCategories } from "@/hooks/useCategories";
import { useGameSetup } from "@/hooks/useGameSetup";

import { useSafeAreaInsets } from "react-native-safe-area-context";

// --- COMPONENTE 1: CONTADOR (Memoizado para rendimiento) ---
const CounterControl = React.memo(
  ({ label, value, min, max, onChange }: any) => {
    const handleDecrease = () => {
      if (value > min) {
        onChange(value - 1);
        Haptics.selectionAsync();
      }
    };
    const handleIncrease = () => {
      if (value < max) {
        onChange(value + 1);
        Haptics.selectionAsync();
      }
    };

    return (
      <View className="flex-row items-center justify-between mb-4 bg-[#302347] p-4 rounded-2xl border border-[#4F387F]/50">
        <Text className="text-lg font-bold text-white font-Helvetica">
          {label}
        </Text>
        <View className="flex-row items-center gap-4">
          <Pressable
            onPress={handleDecrease}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              value <= min ? "bg-[#1C1B1B]/50 opacity-50" : "bg-[#4F387F]"
            }`}
          >
            <Ionicons name="remove" size={24} color="white" />
          </Pressable>

          <Text className="text-2xl font-black text-[#D8B4FE] w-8 text-center font-Helvetica">
            {value}
          </Text>

          <Pressable
            onPress={handleIncrease}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              value >= max ? "bg-[#1C1B1B]/50 opacity-50" : "bg-[#4F387F]"
            }`}
          >
            <Ionicons name="add" size={24} color="white" />
          </Pressable>
        </View>
      </View>
    );
  }
);

// --- COMPONENTE 2: HEADER SEPARADO (Solución al reinicio de animación) ---
// Al sacarlo y usar React.memo, evitamos que se renderice de nuevo al mover jugadores
const SetupHeader = React.memo(
  ({
    playerCount,
    setPlayerCount,
    imposterCount,
    setImposterCount,
    categories,
    selectedCats,
    toggleCategory,
  }: any) => {
    return (
      <View>
        {/* SECCIÓN 1: REGLAS */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          className="mt-4 mb-6"
        >
          <Text className="text-[#D8B4FE] font-bold mb-3 uppercase tracking-widest text-xs">
            Reglas Básicas
          </Text>
          <CounterControl
            label="Jugadores"
            value={playerCount}
            min={3}
            max={20}
            onChange={setPlayerCount}
          />
          <CounterControl
            label="Impostores"
            value={imposterCount}
            min={1}
            max={Math.floor(playerCount / 2)}
            onChange={setImposterCount}
          />
        </Animated.View>

        {/* SECCIÓN 2: CATEGORÍAS */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          className="mb-8"
        >
          <Text className="text-[#D8B4FE] font-bold mb-3 uppercase tracking-widest text-xs">
            Mezcla de Categorías
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {categories.map((cat: any) => {
              const isSelected = selectedCats.includes(cat.id);
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => toggleCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl flex-row items-center border ${
                    isSelected
                      ? "bg-[#D8B4FE] border-[#D8B4FE]"
                      : "bg-[#302347] border-[#4F387F]/30"
                  }`}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={16}
                    color={isSelected ? "#302347" : "#D8B4FE"}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    className={`font-bold text-xs ${
                      isSelected ? "text-[#302347]" : "text-gray-300"
                    }`}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* TÍTULO DE LISTA */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-[#D8B4FE] font-bold uppercase tracking-widest text-xs">
            Orden de Jugadores (Manten para mover)
          </Text>
          <Ionicons name="hand-left-outline" size={14} color="#6b7280" />
        </View>
      </View>
    );
  }
);

// --- PANTALLA PRINCIPAL ---
export default function SetupGameScreen() {
  const router = useRouter();
  const { categories } = useCategories();

  const insets = useSafeAreaInsets();

  const {
    playerCount,
    setPlayerCount,
    imposterCount,
    setImposterCount,
    players,
    updatePlayerName,
    reorderPlayers,
    selectedCats,
    toggleCategory,
  } = useGameSetup();

  const handleStartGame = () => {
    if (selectedCats.length === 0) {
      Alert.alert("Falta Categoría", "Selecciona al menos una categoría.");
      return;
    }

    const finalNames = players.map((p, i) =>
      p.name.trim() === "" ? `Jugador ${i + 1}` : p.name.trim()
    );

    const gameConfig = {
      players: playerCount,
      imposters: imposterCount,
      names: finalNames,
      categories: selectedCats,
    };

    router.push({
      pathname: "/role_pass",
      params: { config: JSON.stringify(gameConfig) },
    });
  };

  // Render Item Memoizado
  const renderItem = useCallback(
    ({ item, drag, isActive, getIndex }: RenderItemParams<any>) => (
      <DraggablePlayerItem
        item={item}
        index={getIndex()!}
        drag={drag}
        isActive={isActive}
        onChangeText={updatePlayerName}
      />
    ),
    [updatePlayerName]
  );

  return (
    <View className="flex-1 bg-[#1C1B1B]">
      {/* HEADER FIJO (Navegación) */}
      <View className="flex-row items-center px-6 pb-4 pt-14 bg-[#1C1B1B] z-10 border-b border-[#4F387F]/10">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-[#4F387F]/20 active:bg-[#4F387F]/40 mr-4"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text className="text-2xl font-black tracking-wider text-white font-Helvetica">
          Configurar Partida
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <DraggableFlatList
          data={players}
          onDragEnd={reorderPlayers}
          keyExtractor={(item) => item.id}
          // HEADER PASADO COMO PROP (Evita re-renders y reinicio de animaciones)
          ListHeaderComponent={
            <SetupHeader
              playerCount={playerCount}
              setPlayerCount={setPlayerCount}
              imposterCount={imposterCount}
              setImposterCount={setImposterCount}
              categories={categories}
              selectedCats={selectedCats}
              toggleCategory={toggleCategory}
            />
          }
          // SOLUCIÓN AL SCROLL Y TECLADO:
          // 1. Damos mucho padding abajo para que al scrollear el último item suba por encima del teclado
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 150, // Mucho espacio extra
            paddingTop: 10,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag" // Oculta teclado al deslizar la lista
          renderItem={renderItem}
          // Optimización para listas largas
          removeClippedSubviews={false}
        />

        {/* FOOTER FLOTANTE SOBRE EL TECLADO */}
        <View
          className="p-6 pt-4 bg-[#1C1B1B] border-t border-[#4F387F]/20"
          style={{ paddingBottom: Math.max(insets.bottom, 20) }}
        >
          <Pressable
            onPress={handleStartGame}
            className="w-full bg-[#D8B4FE] py-4 rounded-3xl items-center shadow-lg shadow-purple-500/20 active:scale-95 transition-transform"
          >
            <Text className="text-[#302347] font-black text-xl font-Helvetica tracking-wider">
              ¡COMENZAR JUEGO!
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
