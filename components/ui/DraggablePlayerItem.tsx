// Pon esto al principio de setup_game.tsx o en un archivo aparte components/DraggablePlayerItem.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect } from "react";
import { Pressable, Text, TextInput } from "react-native";
import { ScaleDecorator } from "react-native-draggable-flatlist";
import Animated, {
    cancelAnimation,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";

export const DraggablePlayerItem = ({
  item,
  index,
  drag,
  isActive,
  onChangeText,
}: any) => {
  // Lógica de Temblor (Shake)
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      // Vibración inicial fuerte
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Animación de temblor: rota entre -2deg y 2deg infinitamente
      rotation.value = withRepeat(
        withSequence(
          withTiming(-2, { duration: 100 }),
          withTiming(2, { duration: 100 })
        ),
        -1, // Infinito
        true // Reversa
      );
    } else {
      // Detener temblor
      cancelAnimation(rotation);
      rotation.value = withTiming(0);
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` },
        { scale: isActive ? 1.05 : 1 },
      ],
      zIndex: isActive ? 999 : 1, // Traer al frente
    };
  });

  return (
    <ScaleDecorator>
      <Animated.View
        style={[animatedStyle]}
        className={`flex-row items-center mb-3 ${
          isActive ? "opacity-90" : "opacity-100"
        }`}
      >
        {/* MANIJA DE ARRASTRE (Drag Handle) - MANTENER PRESIONADO AQUÍ */}
        <Pressable
          onLongPress={drag}
          disabled={isActive}
          className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
            isActive ? "bg-[#D8B4FE]" : "bg-[#4F387F]/30"
          }`}
        >
          {isActive ? (
            <Ionicons name="move" size={20} color="#302347" />
          ) : (
            <Text className="text-[#D8B4FE] font-bold text-xs">
              {index + 1}
            </Text>
          )}
        </Pressable>

        {/* INPUT DE NOMBRE */}
        <TextInput
          value={item.name}
          onChangeText={(text) => onChangeText(text, index)}
          placeholder={`Jugador ${index + 1}`}
          placeholderTextColor="#4b5563"
          className={`flex-1 bg-[#262626] text-white px-4 py-3 rounded-xl border font-Helvetica ${
            isActive ? "border-[#D8B4FE] bg-[#302347]" : "border-[#4F387F]/30"
          }`}
          // Importante: Si estás arrastrando, no queremos editar texto
          editable={!isActive}
        />

        {/* Icono visual de "reorder" a la derecha para indicar que se puede mover */}
        <Pressable onLongPress={drag} className="py-2 pl-3">
          <Ionicons name="reorder-two" size={24} color="#4F387F" />
        </Pressable>
      </Animated.View>
    </ScaleDecorator>
  );
};
