import { useEffect } from "react";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";

const Skeleton = ({
  className,
  style,
}: {
  className?: string;
  style?: any;
}) => {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.ease }),
        withTiming(0.5, { duration: 1000, easing: Easing.ease })
      ),
      -1, // Infinito
      true // Reverse (vuelve atrás suavemente)
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      className={`bg-[#302347] ${className}`} // Color base del skeleton (mismo tono que tus cards)
      style={[animatedStyle, style]}
    />
  );
};

export default Skeleton;
