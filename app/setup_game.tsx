import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics"; // Opcional: para vibración táctil
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeIn, FadeInDown, Layout } from "react-native-reanimated";

// Hooks
import { useCategories } from "@/hooks/useCategories";

// --- COMPONENTE: CONTADOR [+ / -] ---
const CounterControl = ({ label, value, min, max, onChange }: any) => {
  const handleDecrease = () => {
    if (value > min) {
      onChange(value - 1);
      Haptics.selectionAsync(); // Vibración suave
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
};

export default function SetupGameScreen() {
  const router = useRouter();
  const { categories } = useCategories();

  // --- ESTADOS DE CONFIGURACIÓN ---
  const [playerCount, setPlayerCount] = useState(4);
  const [imposterCount, setImposterCount] = useState(1);
  const [selectedCats, setSelectedCats] = useState<number[]>([]);

  // Array dinámico de nombres
  const [playerNames, setPlayerNames] = useState<string[]>(
    Array(4).fill("") // Inicializa con 4 espacios vacíos
  );

  // --- LÓGICA DE JUGADORES ---
  const handlePlayerCountChange = (newCount: number) => {
    setPlayerCount(newCount);

    // Ajustar array de nombres (agregar vacíos o recortar)
    if (newCount > playerNames.length) {
      // Agregar
      const added = Array(newCount - playerNames.length).fill("");
      setPlayerNames([...playerNames, ...added]);
    } else {
      // Recortar
      setPlayerNames(playerNames.slice(0, newCount));
    }

    // Validar impostores (Max impostores = Jugadores - 1, recomendado Jugadores / 2)
    if (imposterCount >= newCount) {
      setImposterCount(Math.max(1, newCount - 1));
    }
  };

  const handleNameChange = (text: string, index: number) => {
    const newNames = [...playerNames];
    newNames[index] = text;
    setPlayerNames(newNames);
  };

  // --- LÓGICA DE CATEGORÍAS ---
  const toggleCategory = (id: number) => {
    if (selectedCats.includes(id)) {
      setSelectedCats(selectedCats.filter((c) => c !== id));
    } else {
      setSelectedCats([...selectedCats, id]);
    }
    Haptics.selectionAsync();
  };

  // --- INICIAR JUEGO ---
  const handleStartGame = () => {
    // 1. Validaciones: Que haya categorías
    if (selectedCats.length === 0) {
      Alert.alert(
        "Falta Categoría",
        "Selecciona al menos una categoría para jugar."
      );
      return;
    }

    // 2. Rellenar nombres vacíos con defaults (Jugador 1, Jugador 2...)
    const finalNames = playerNames.map((name, i) =>
      name.trim() === "" ? `Jugador ${i + 1}` : name.trim()
    );

    // 3. Crear el objeto de configuración
    const gameConfig = {
      players: playerCount,
      imposters: imposterCount,
      names: finalNames,
      categories: selectedCats,
    };
    console.log("configuracion del game: ", gameConfig);

    // 4. NAVEGACIÓN REAL
    // Serializamos el objeto a string para pasarlo por URL
    router.push({
      pathname: "/role_pass",
      params: { config: JSON.stringify(gameConfig) },
    });
  };

  return (
    <View className="flex-1 bg-[#1C1B1B]">
      {/* HEADER */}
      <View className="flex-row items-center px-6 pb-4 pt-14">
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

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* SECCIÓN 1: REGLAS NUMÉRICAS */}
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
            onChange={handlePlayerCountChange}
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
          {categories.length === 0 ? (
            <Text className="italic text-gray-500">
              No hay categorías. Crea una primero.{" "}
              <TouchableOpacity onPress={() => router.push("/add_category")}>
                <Text className="text-[#D8B4FE] underline">
                  Crear categoria
                </Text>
              </TouchableOpacity>
            </Text>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {categories.map((cat) => {
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
          )}
        </Animated.View>

        {/* SECCIÓN 3: NOMBRES DE JUGADORES */}
        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          className="mb-24"
        >
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-[#D8B4FE] font-bold uppercase tracking-widest text-xs">
              Nombres (Sentido Horario ↻)
            </Text>
            <Text className="text-gray-500 text-[10px]">Opcional</Text>
          </View>

          {playerNames.map((name, index) => (
            <Animated.View
              key={index}
              layout={Layout.springify()}
              entering={FadeIn.duration(300)}
              className="flex-row items-center mb-3"
            >
              <View className="w-8 h-8 rounded-full bg-[#4F387F]/30 items-center justify-center mr-3">
                <Text className="text-[#D8B4FE] font-bold text-xs">
                  {index + 1}
                </Text>
              </View>
              <TextInput
                value={name}
                onChangeText={(text) => handleNameChange(text, index)}
                placeholder={`Jugador ${index + 1}`}
                placeholderTextColor="#4b5563"
                className="flex-1 bg-[#262626] text-white px-4 py-3 rounded-xl border border-[#4F387F]/30 focus:border-[#D8B4FE] font-Helvetica"
              />
            </Animated.View>
          ))}
        </Animated.View>
      </ScrollView>

      {/* FOOTER: BOTÓN JUGAR */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View className="p-6 pt-2 bg-[#1C1B1B] border-t border-[#4F387F]/20">
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
