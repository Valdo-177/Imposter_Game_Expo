import React from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  onPress?: () => void;
  title?: string;
  // Nuevas props opcionales con valores por defecto
  mainColor?: string;    // El color claro de arriba (#4F387F)
  depthColor?: string;   // El color oscuro de la base/borde (#302347)
  textColor?: string;    // Color del texto
  className?: string;    // Para pasar márgenes o estilos extra desde fuera
};

const BtnPlay = ({ 
  onPress, 
  title = "Empezar", 
  mainColor = "#4F387F", // Tu color original por defecto
  depthColor = "#302347", // Tu color oscuro original
  textColor = "#FFFFFF",
  className = "" 
}: Props) => {
  return (
    <Pressable
      onPress={onPress}
      // Agregamos className prop aquí por si necesitas margen externo (ej: "mt-4")
      className={`transition-all active:opacity-90 active:scale-95 ${className}`}
    >
      {/* CAPA DE PROFUNDIDAD (Base oscura) */}
      <View 
        className="pb-2 shadow-lg rounded-3xl shadow-black/40"
        style={{ backgroundColor: depthColor }} // Usamos style para color dinámico
      >
        {/* CAPA SUPERIOR (Color principal) */}
        <View 
          className="relative px-12 py-3 overflow-hidden border-t-4 rounded-3xl"
          style={{ 
            backgroundColor: mainColor, 
            borderColor: depthColor // El borde superior usa el color de profundidad
          }}
        >
          {/* Brillo decorativo (se mantiene igual, blanco transparente) */}
          <View className="absolute w-16 h-8 rounded-full -top-2 left-4 bg-white/20 -rotate-12" />
          
          <Text 
            className="text-4xl font-black tracking-wider text-center font-Helvetica"
            style={{ color: textColor }}
          >
            {title}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default BtnPlay;