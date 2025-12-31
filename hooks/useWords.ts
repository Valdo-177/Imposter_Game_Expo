import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";

// 1. Actualizamos la interfaz
export interface WordWithCategory {
  id: number;
  text: string;
  hint?: string; // <--- Nuevo campo (opcional)
  category_id: number;
  difficulty: 1 | 2 | 3;
  category_name?: string; 
  category_icon?: string; 
}

export const useWords = () => {
  const db = useSQLiteContext();
  const [words, setWords] = useState<WordWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // OBTENER TODAS (El SELECT w.* ya trae la columna hint si existe en la BD)
  const fetchAllWords = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await db.getAllAsync<WordWithCategory>(`
        SELECT w.*, c.name as category_name, c.icon as category_icon
        FROM words w
        LEFT JOIN categories c ON w.category_id = c.id
        ORDER BY w.id DESC
      `);
      setWords(result);
    } catch (error) {
      console.error("Error al leer palabras:", error);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  // 2. AGREGAR PALABRA (Recibimos hint)
  const addWord = async (
    text: string,
    categoryId: number,
    difficulty: number,
    hint: string = "" // Valor por defecto vacío
  ) => {
    try {
      const cleanText = text.trim();
      const cleanHint = hint.trim();

      if (!cleanText)
        return { success: false, error: "El texto no puede estar vacío" };

      const existing = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM words WHERE LOWER(text) = LOWER(?) AND category_id = ?`,
        [cleanText, categoryId]
      );
      if (existing && existing.count > 0)
        return {
          success: false,
          error: "Esta palabra ya existe en esta categoría",
        };

      // INCLUIMOS hint EN EL INSERT
      await db.runAsync(
        "INSERT INTO words (text, category_id, difficulty, hint) VALUES (?, ?, ?, ?)",
        cleanText,
        categoryId,
        difficulty,
        cleanHint
      );
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, error: "Error BD al guardar" };
    }
  };

  // 3. ACTUALIZAR PALABRA (Recibimos hint)
  const updateWord = async (
    id: number,
    text: string,
    categoryId: number,
    difficulty: number,
    hint: string = ""
  ) => {
    try {
      const cleanText = text.trim();
      const cleanHint = hint.trim();

      const existing = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM words 
         WHERE LOWER(text) = LOWER(?) AND category_id = ? AND id != ?`,
        [cleanText, categoryId, id]
      );

      if (existing && existing.count > 0) {
        return { success: false, error: "Esa palabra ya existe" };
      }

      // INCLUIMOS hint EN EL UPDATE
      await db.runAsync(
        "UPDATE words SET text = ?, category_id = ?, difficulty = ?, hint = ? WHERE id = ?",
        cleanText,
        categoryId,
        difficulty,
        cleanHint,
        id
      );

      return { success: true };
    } catch (error) {
      console.error("Error update:", error);
      return { success: false, error: "Error al actualizar" };
    }
  };

  const deleteWord = async (id: number) => {
    try {
      await db.runAsync("DELETE FROM words WHERE id = ?", id);
      return true;
    } catch (error) {
      return false;
    }
  };

  return {
    words,
    isLoading,
    fetchAllWords,
    addWord,
    updateWord,
    deleteWord,
  };
};