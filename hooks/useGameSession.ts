import { useEffect, useState } from "react";
import { useWords } from "./useWords";

// 1. Actualizamos el tipo para incluir la pista (opcional)
export type PlayerRole = {
  name: string;
  isImposter: boolean;
  word: string;
  hint?: string; // <--- NUEVO CAMPO
};

export const useGameSession = (configJson: string) => {
  const { words, fetchAllWords } = useWords();
  
  const [playersQueue, setPlayersQueue] = useState<PlayerRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (words.length === 0) {
        fetchAllWords();
        return; 
    }

    if (playersQueue.length > 0) return;

    const initGame = () => {
      try {
        const config = JSON.parse(configJson);

        // 1. Filtrar palabras
        const availableWords = words.filter((w) =>
            config.categories.includes(w.category_id)
        );

        if (availableWords.length === 0) {
            setError("No hay palabras en las categorías seleccionadas.");
            setLoading(false);
            return;
        }

        // 2. Palabra Secreta y Pista
        const randomIndex = Math.floor(Math.random() * availableWords.length);
        const secretWordObj = availableWords[randomIndex];
        
        const secretWord = secretWordObj.text;
        // Obtenemos la pista (si no existe, ponemos un string vacío por seguridad)
        const secretHint = secretWordObj.hint || "Sin pista disponible"; 

        // 3. Roles
        let rolesArr = Array(config.players).fill("civilian");
        let impostersAssigned = 0;
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
            (name: string, index: number) => {
                const isImposter = rolesArr[index] === "imposter";
                return {
                    name,
                    isImposter,
                    word: isImposter ? "Eres el IMPOSTOR" : secretWord,
                    // Si es impostor, le damos la pista de la palabra secreta.
                    // Si es civil, undefined (o null) para que no la vea.
                    hint: isImposter ? secretHint : undefined 
                };
            }
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
  }, [words, configJson]);

  return { playersQueue, loading, error };
};