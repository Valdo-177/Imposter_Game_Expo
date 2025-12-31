import ParallaxScrollView from "@/components/parallax-scroll-view";
import { PlayerRole } from "@/hooks/useGameSession";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";

export default function GameRoomScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // 1. Recibir y Parsear Jugadores
  const [players, setPlayers] = useState<PlayerRole[]>([]);
  const [starterName, setStarterName] = useState<string>("");

  const gameConfig = (params.gameConfig as string) || "{}";

  useEffect(() => {
    if (params.players) {
      try {
        const parsedPlayers = JSON.parse(params.players as string);
        setPlayers(parsedPlayers);

        // 2. ELEGIR AL AZAR QUIÉN EMPIEZA
        const randomIndex = Math.floor(Math.random() * parsedPlayers.length);
        setStarterName(parsedPlayers[randomIndex].name);
      } catch (e) {
        console.error("Error parsing players", e);
      }
    }
  }, [params.players]);

  // Manejador para revelar (fin del juego)
  const handleReveal = () => {
    const imposters = players
      .filter((p) => p.isImposter)
      .map((p) => p.name)
      .join(", ");
    const secretWord =
      players.find((p) => !p.isImposter)?.word || "Desconocida";

    Alert.alert(
      "Resultados Finales",
      `🕵️ IMPOSTORES: \n${imposters}\n\n📝 PALABRA SECRETA: \n${secretWord}`,
      [
        { text: "Seguir Jugando", style: "cancel" },
        {
          text: "Terminar Partida",
          style: "destructive",
          onPress: () => router.dismissAll(),
        },
      ]
    );
  };

  const handleRematch = () => {
    // Usamos 'replace' en vez de 'push' para reiniciar el historial
    // y que al dar 'atrás' no vuelvas a la partida terminada.
    router.replace({
      pathname: "/role_pass",
      params: { config: gameConfig }, // 🔄 ¡Aquí está la magia! Le devolvemos la config intacta.
    });
  };

  return (
    <View className="flex-1">
      <Pressable
        onPress={() => router.dismissAll()}
        className="absolute top-14 z-50 w-10 h-10 items-center justify-center rounded-full right-6 bg-[#4F387F]/20 active:bg-[#4F387F]/40"
      >
        <Ionicons name="close" size={24} color="white" />
      </Pressable>
      <ParallaxScrollView
        headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
        headerImage={
          <Image
            source={require("@/assets/images/Cover-inicial.png")}
            style={{
              height: "100%",
              width: "100%",
              bottom: 0,
              left: 0,
              position: "absolute",
            }}
          />
        }
      >
        <View className="items-center justify-center h-full p-6">
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            className="mb-8"
          >
            <Text className="px-4 text-lg leading-6 text-center text-gray-300 fo font-Helvetica">
              ¡Shhh! 🤫 El juego ha comenzado.{"\n"}Atrapa al impostor sin
              revelar la palabra.
            </Text>
          </Animated.View>

          {/* QUIÉN EMPIEZA (Pill Destacada) */}
          <Animated.View
            entering={ZoomIn.delay(400).springify()}
            className="mb-10 bg-[#302347] px-6 py-4 rounded-3xl border border-[#4F387F] shadow-lg shadow-purple-900/40 items-center"
          >
            <Text className="text-sm font-bold text-[#D8B4FE] uppercase tracking-widest mb-1 font-Helvetica">
              Turno Inicial
            </Text>
            <Text className="text-2xl font-black text-white font-Helvetica">
              {starterName}
            </Text>
            <Text className="mt-1 text-xs text-gray-400">
              Empieza la conversación
            </Text>
          </Animated.View>

          {/* BOTÓN REVELAR (Acción Principal) */}
          <View className="w-full gap-10 px-6">
            <Pressable
              onPress={handleRematch}
              className="bg-[#D8B4FE] px-8 py-4 rounded-full shadow-lg active:scale-95"
            >
              <Text className="text-[#302347] font-black text-center text-lg font-Helvetica">
                JUGAR OTRA VEZ
              </Text>
            </Pressable>
            
            <Pressable
              onPress={handleReveal}
              className="items-center w-full mb-4 transition-transform active:scale-95"
            >
              <Text className="text-lg font-black tracking-wider text-white underline uppercase font-Helvetica">
                Revelar Identidades
              </Text>
            </Pressable>
          </View>
        </View>
      </ParallaxScrollView>
    </View>
  );
}
