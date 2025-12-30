import { useEffect, useState } from "react";
import { useWords } from "./useWords";

export type PlayerRole = {
  name: string;
  isImposter: boolean;
  word: string;
};

export const useGameSession = (configJson: string) => {
  // Asegúrate de que useWords exporte fetchAllWords (ver paso 3)
  const { words, fetchAllWords } = useWords();
  
  const [playersQueue, setPlayersQueue] = useState<PlayerRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Si no hay palabras cargadas, pedirlas y esperar.
    if (words.length === 0) {
        fetchAllWords();
        return; 
    }

    // Si ya calculamos los roles, no hacer nada (evita re-shuffle infinito)
    if (playersQueue.length > 0) return;

    const initGame = () => {
      try {
        const config = JSON.parse(configJson);
        // config: { players, imposters, names, categories }

        // 1. Filtrar palabras
        const availableWords = words.filter((w) =>
            config.categories.includes(w.category_id)
        );

        if (availableWords.length === 0) {
            setError("No hay palabras en las categorías seleccionadas.");
            setLoading(false);
            return;
        }

        // 2. Palabra Secreta
        const randomIndex = Math.floor(Math.random() * availableWords.length);
        const secretWordObj = availableWords[randomIndex];
        const secretWord = secretWordObj.text;

        // 3. Roles
        let rolesArr = Array(config.players).fill("civilian");
        let impostersAssigned = 0;
        
        // Evitar bucle infinito si hay error de config
        const maxImposters = Math.min(config.imposters, config.players); 

        while (impostersAssigned < maxImposters) {
            const idx = Math.floor(Math.random() * config.players);
            if (rolesArr[idx] === "civilian") {
            rolesArr[idx] = "imposter";
            impostersAssigned++;
            }
        }

        // 4. Mapear
        const finalPlayers: PlayerRole[] = config.names.map(
            (name: string, index: number) => ({
            name,
            isImposter: rolesArr[index] === "imposter",
            word: rolesArr[index] === "imposter" ? "Eres el IMPOSTOR" : secretWord,
            })
        );

        setPlayersQueue(finalPlayers);
        setLoading(false);
      } catch (e) {
        console.error(e);
        setError("Error al iniciar la sesión de juego.");
        setLoading(false);
      }
    };

    initGame();
  }, [words, configJson]); // Dependencias clave

  return { playersQueue, loading, error };
};