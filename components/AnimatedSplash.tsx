import LottieView from "lottie-react-native";
import React, { useEffect, useRef, useState } from "react"; // <--- 1. Importar useState
import { StyleSheet } from "react-native";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

interface Props {
  onFinish: () => void;
}

export default function AnimatedSplash({ onFinish }: Props) {
  const animation = useRef<LottieView>(null);
  const opacity = useSharedValue(1);
  
  // 2. Nuevo estado para controlar los clicks
  const [isFading, setIsFading] = useState(false);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  useEffect(() => {
    animation.current?.play();
  }, []);

  return (
    <Animated.View
      // 3. LA SOLUCIÓN MÁGICA:
      // Si está desvaneciendo (isFading), pointerEvents="none" deja pasar los clicks a la app.
      // Si no, "auto" atrapa los clicks para que no toquen la app mientras carga.
      pointerEvents={isFading ? "none" : "auto"} 
      
      style={[
        StyleSheet.absoluteFill,
        containerStyle,
        {
          backgroundColor: "#1C1B1B",
          zIndex: 9999,
        },
      ]}
      className="items-center justify-center bg-[#1C1B1B]"
    >
      <LottieView
        ref={animation}
        source={require("@/assets/animations/splash-animation.json")}
        autoPlay={false}
        loop={false}
        resizeMode="cover" // Asegúrate de tener cover para que llene la pantalla
        style={{
          width: "100%",
          height: "100%",
        }}
        onAnimationFinish={(isCancelled) => {
          if (!isCancelled) {
            // 4. Activamos el modo "Fantasma" inmediatamente
            setIsFading(true); 

            // Bajamos la opacidad
            opacity.value = withTiming(0, { duration: 500 }, (finished) => {
              if (finished) {
                runOnJS(onFinish)();
              }
            });
          }
        }}
      />
    </Animated.View>
  );
}