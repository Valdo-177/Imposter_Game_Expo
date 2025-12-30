import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";

// Interfaz enriquecida para la lista (incluye datos de la categoría)
export interface WordWithCategory {
  id: number;
  text: string;
  category_id: number;
  difficulty: 1 | 2 | 3;
  category_name?: string; // Viene del JOIN
  category_icon?: string; // Viene del JOIN
}

export const useWords = () => {
  const db = useSQLiteContext();
  // Usamos la interfaz enriquecida
  const [words, setWords] = useState<WordWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. OBTENER TODAS LAS PALABRAS (CON DATOS DE CATEGORÍA)
  const fetchAllWords = useCallback(async () => {
    setIsLoading(true);
    try {
      // JOIN: Unimos tablas para traer el nombre e icono de la categoría en una sola consulta
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

  // 2. AGREGAR PALABRA (Ya la tienes, la dejo igual)
  const addWord = async (
    text: string,
    categoryId: number,
    difficulty: number
  ) => {
    try {
      const cleanText = text.trim();
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

      await db.runAsync(
        "INSERT INTO words (text, category_id, difficulty) VALUES (?, ?, ?)",
        cleanText,
        categoryId,
        difficulty
      );
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, error: "Error BD" };
    }
  };

  // 3. ACTUALIZAR PALABRA (NUEVO)
  const updateWord = async (
    id: number,
    text: string,
    categoryId: number,
    difficulty: number
  ) => {
    try {
      const cleanText = text.trim();
      // Validamos duplicados EXCLUYENDO la palabra actual (id != ?)
      const existing = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM words 
         WHERE LOWER(text) = LOWER(?) AND category_id = ? AND id != ?`,
        [cleanText, categoryId, id]
      );

      if (existing && existing.count > 0) {
        return { success: false, error: "Esa palabra ya existe" };
      }

      await db.runAsync(
        "UPDATE words SET text = ?, category_id = ?, difficulty = ? WHERE id = ?",
        cleanText,
        categoryId,
        difficulty,
        id
      );

      return { success: true };
    } catch (error) {
      console.error("Error update:", error);
      return { success: false, error: "Error al actualizar" };
    }
  };

  // 4. ELIMINAR PALABRA
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
    fetchAllWords, // <--- Importante exportar esto
    addWord,
    updateWord, // <--- Y esto
    deleteWord,
  };
};
