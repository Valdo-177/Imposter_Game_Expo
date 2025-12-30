import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
    FadeInDown,
    runOnJS,
    SlideInRight,
    SlideOutLeft,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from "react-native-reanimated";

// Hooks
import { PlayerRole, useGameSession } from "@/hooks/useGameSession";

// --- COMPONENTE: CARTA DESLIZABLE (Hold to Peek) ---
const SecretCard = ({
  player,
  onPeek,
}: {
  player: PlayerRole;
  onPeek: () => void;
}) => {
  const translateY = useSharedValue(0);

  // GESTO DE DESLIZAMIENTO
  const pan = Gesture.Pan()
    .onUpdate((event) => {
      // Permitimos deslizar hacia arriba (negativo)
      // Limitamos para que no se vaya infinito (-400)
      translateY.value = Math.max(event.translationY, -400);

      // Si desliza más de 150px, consideramos que "miró"
      if (event.translationY < -150) {
        runOnJS(onPeek)();
      }
    })
    .onEnd(() => {
      // AL SOLTAR: SIEMPRE REGRESA A TAPAR (Rebote)
      translateY.value = withSpring(0, { damping: 90, stiffness: 500 });
    });

  // Estilo de la TAPA (Cover) - SIEMPRE OPACA
  const coverStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    // Eliminamos la opacidad para que no desaparezca
  }));

  return (
    <View className="w-full h-[400px] relative items-center justify-center mb-10">
      {/* 1. CAPA INFERIOR: EL ROL (LO SECRETO) */}
      <View
        className={`absolute w-[85%] h-full rounded-3xl items-center justify-center border-4 p-6 ${
          player.isImposter
            ? "bg-[#301c25] border-red-500/50"
            : "bg-[#1c2830] border-blue-500/50"
        }`}
      >
        <Ionicons
          name={player.isImposter ? "skull-outline" : "search-outline"}
          size={80}
          color={player.isImposter ? "#f87171" : "#60a5fa"}
        />
        <Text
          className={`text-3xl font-black mt-6 text-center font-Helvetica ${
            player.isImposter ? "text-red-400" : "text-blue-400"
          }`}
        >
          {player.word}
        </Text>
        <Text className="mt-2 text-sm tracking-widest text-gray-400 uppercase font-Helvetica">
          {player.isImposter ? "Engaña a los demás" : "Encuentra al impostor"}
        </Text>
      </View>

      {/* 2. CAPA SUPERIOR: LA TAPA DESLIZABLE */}
      <GestureDetector gesture={pan}>
        <Animated.View
          className="absolute w-[85%] h-full bg-[#302347] rounded-3xl border border-[#4F387F] items-center justify-center shadow-2xl shadow-black z-10"
          style={coverStyle}
        >
          {/* Textura visual o patrón */}
          <View className="absolute top-4 w-12 h-1 bg-[#4F387F]/50 rounded-full" />

          <View className="items-center opacity-80">
            <View className="w-20 h-20 rounded-full bg-[#1C1B1B]/30 items-center justify-center mb-4 border border-[#D8B4FE]/20">
              <Ionicons name="finger-print" size={40} color="#D8B4FE" />
            </View>
            <Text className="text-lg font-bold text-white font-Helvetica">
              MANTÉN PARA VER
            </Text>
            <Text className="text-[#D8B4FE] text-xs mt-1 uppercase tracking-widest">
              Suelta para ocultar
            </Text>

            <View className="mt-8 animate-bounce">
              <Ionicons name="chevron-up" size={24} color="white" />
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// --- PANTALLA PRINCIPAL ---
export default function RolePassScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const rawConfig = Array.isArray(params.config)
    ? params.config[0]
    : params.config;
  const configString = typeof rawConfig === "string" ? rawConfig : "{}";

  const { playersQueue, loading, error } = useGameSession(configString);

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [hasPeeked, setHasPeeked] = useState(false); // Nuevo estado: ¿Ya miró?

  const handleNext = () => {
    if (currentPlayerIndex < playersQueue.length - 1) {
      // Siguiente jugador
      setCurrentPlayerIndex((prev) => prev + 1);
      setHasPeeked(false); // Reseteamos para el siguiente
    } else {
      // FIN DE REPARTO -> IR AL JUEGO (GAME ROOM)
      // Pasamos los datos de los jugadores a la siguiente pantalla
      router.push({
        pathname: "/game_room",
        params: { 
            players: JSON.stringify(playersQueue) 
        },
      });
    }
  };

  if (loading)
    return (
      <View className="flex-1 bg-[#1C1B1B] items-center justify-center">
        <Text className="text-white">Preparando partida...</Text>
      </View>
    );
  if (error || playersQueue.length === 0)
    return (
      <View className="flex-1 bg-[#1C1B1B] items-center justify-center">
        <Text className="px-6 text-center text-red-500">Error: {error}</Text>
      </View>
    );

  const currentPlayer = playersQueue[currentPlayerIndex];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 bg-[#1C1B1B]">
        {/* HEADER: TURNO */}
        <View className="items-center px-6 pt-16">
          <Text className="text-gray-400 text-xs uppercase tracking-[0.2em] mb-2">
            Turno del Jugador {currentPlayerIndex + 1}/{playersQueue.length}
          </Text>
          <Text className="text-4xl italic font-black text-center text-white font-Helvetica">
            {currentPlayer.name}
          </Text>
          <Text className="px-10 mt-2 text-sm text-center text-gray-500">
            Mantén presionada la tarjeta para ver tu rol secreto.
          </Text>
        </View>

        {/* ZONA DE INTERACCIÓN (CARTA CON ANIMACIÓN DE TRANSICIÓN) */}
        <View className="justify-center flex-1 overflow-hidden">
          {/* Usamos Animated.View con `entering` y `exiting` 
             La clave 'key' fuerza a React a desmontar el anterior y montar el nuevo, disparando la animación.
          */}
          <Animated.View
            key={currentPlayerIndex} // <--- CLAVE PARA LA TRANSICIÓN
            entering={SlideInRight.springify().damping(100)}
            exiting={SlideOutLeft.duration(200)}
            style={{ width: '100%' }}
          >
            <SecretCard
              player={currentPlayer}
              onPeek={() => {
                if (!hasPeeked) {
                    setHasPeeked(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
              }}
            />
          </Animated.View>
        </View>

        {/* FOOTER: BOTÓN SIGUIENTE */}
        <View className="p-6 pb-10 h-[120px] justify-end">
          {hasPeeked ? (
            <Animated.View entering={FadeInDown.springify()}>
              <Pressable
                onPress={handleNext}
                className="w-full bg-[#D8B4FE] py-4 rounded-3xl items-center shadow-lg shadow-purple-500/20 active:scale-95 transition-transform"
              >
                <Text className="text-[#302347] font-black text-xl font-Helvetica tracking-wider">
                  {currentPlayerIndex === playersQueue.length - 1
                    ? "EMPEZAR JUEGO"
                    : "SIGUIENTE JUGADOR"}
                </Text>
              </Pressable>
            </Animated.View>
          ) : (
             // Espacio vacío para que no salte el layout
             <View />
          )}
        </View>
      </View>
    </GestureHandlerRootView>
  );
}