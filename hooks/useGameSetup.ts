import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";

export const useGameSetup = (initialCount = 4) => {
  const [playerCount, setPlayerCount] = useState(initialCount);
  const [imposterCount, setImposterCount] = useState(1);

  // Ahora los nombres son objetos con ID único para que el Drag&Drop no se pierda
  const [players, setPlayers] = useState<{ id: string; name: string }[]>(
    Array.from({ length: initialCount }, (_, i) => ({
      id: `player-${i}`,
      name: "",
    }))
  );

  const [selectedCats, setSelectedCats] = useState<number[]>([]);

  // 1. CAMBIAR CANTIDAD DE JUGADORES
  const handlePlayerCountChange = (newCount: number) => {
    setPlayerCount(newCount);

    if (newCount > players.length) {
      // Agregar nuevos
      const newItems = Array.from(
        { length: newCount - players.length },
        (_, i) => ({
          id: `player-${players.length + i}-${Date.now()}`, // ID único
          name: "",
        })
      );
      setPlayers([...players, ...newItems]);
    } else {
      // Recortar (quitamos del final)
      setPlayers(players.slice(0, newCount));
    }

    // Ajustar impostores si es necesario
    if (imposterCount >= newCount) {
      setImposterCount(Math.max(1, newCount - 1));
    }
  };

  // 2. CAMBIAR NOMBRE INDIVIDUAL
  const updatePlayerName = (text: string, index: number) => {
    const updated = [...players];
    updated[index].name = text;
    setPlayers(updated);
  };

  // 3. REORDENAR (Drag & Drop)
  const reorderPlayers = useCallback(({ data }: { data: any[] }) => {
    setPlayers(data);
  }, []);

  // 4. CATEGORÍAS
  const toggleCategory = (id: number) => {
    if (selectedCats.includes(id)) {
      setSelectedCats(selectedCats.filter((c) => c !== id));
    } else {
      setSelectedCats([...selectedCats, id]);
    }
    Haptics.selectionAsync();
  };

  return {
    playerCount,
    setPlayerCount: handlePlayerCountChange, // Usamos nuestra función inteligente
    imposterCount,
    setImposterCount,
    players,
    updatePlayerName,
    reorderPlayers, // <--- La función mágica para el DragList
    selectedCats,
    toggleCategory,
  };
};
