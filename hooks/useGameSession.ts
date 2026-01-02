import { useEffect, useState } from "react";
import { useWords } from "./useWords";

export type PlayerRole = {
  name: string;
  isImposter: boolean;
  word: string;
  hint?: string;
};

export const useGameSession = (configJson: string) => {
  const { words, fetchAllWords } = useWords();
  
  const [playersQueue, setPlayersQueue] = useState<PlayerRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Si no hay palabras cargadas, las pedimos
    if (words.length === 0) {
        fetchAllWords();
        return; 
    }

    // Si ya se generó la cola, no hacemos nada (evita re-renders infinitos)
    if (playersQueue.length > 0) return;

    const initGame = () => {
      try {
        const config = JSON.parse(configJson);

        // 1. Filtrar palabras por categoría
        const availableWords = words.filter((w) =>
            config.categories.includes(w.category_id)
        );

        if (availableWords.length === 0) {
            setError("No hay palabras en las categorías seleccionadas.");
            setLoading(false);
            return;
        }

        // 2. Selección de Palabra y PROCESAMIENTO DE PISTAS MÚLTIPLES
        const randomIndex = Math.floor(Math.random() * availableWords.length);
        const secretWordObj = availableWords[randomIndex];
        const secretWord = secretWordObj.text;
        
        // --- LOGICA NUEVA: SEPARAR PISTAS POR COMA ---
        const rawHint = secretWordObj.hint || "";
        
        // Convertimos "Pista A, Pista B, Pista C" -> ["Pista A", "Pista B", "Pista C"]
        // .trim() elimina espacios al inicio/final de cada pista
        // .filter() elimina pistas vacías (por si alguien puso ",,")
        let hintsArray = rawHint.split(",").map(h => h.trim()).filter(h => h.length > 0);

        // Fallback: Si no hay pistas, ponemos un mensaje por defecto
        if (hintsArray.length === 0) {
            hintsArray = ["Sin pista disponible"];
        }
        // ----------------------------------------------

        // 3. Asignación de Roles (Impostores vs Civiles)
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

        // 4. Mapear Jugadores y ASIGNAR PISTAS CÍCLICAMENTE
        let currentImposterIndex = 0; // Contador para saber qué pista dar

        const finalPlayers: PlayerRole[] = config.names.map(
            (name: string, index: number) => {
                const isImposter = rolesArr[index] === "imposter";
                let assignedHint: string | undefined = undefined;

                if (isImposter) {
                    // Usamos el operador módulo (%) para rotar las pistas
                    // Si hay 2 pistas y es el 3er impostor: 2 % 2 = 0 (vuelve a la primera pista)
                    const hintIndex = currentImposterIndex % hintsArray.length;
                    assignedHint = hintsArray[hintIndex];
                    
                    currentImposterIndex++; // Preparamos para el siguiente impostor
                }

                return {
                    name,
                    isImposter,
                    word: isImposter ? "Eres el IMPOSTOR" : secretWord,
                    hint: assignedHint 
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