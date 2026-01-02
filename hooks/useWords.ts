import * as Sharing from "expo-sharing";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
// Usamos legacy para métodos de archivo y el normal para constantes si es necesario
import * as FileSystem from "expo-file-system/legacy";

export interface WordWithCategory {
  id: number;
  text: string;
  hint?: string;
  category_id: number;
  difficulty: 1 | 2 | 3;
  category_name?: string;
  category_icon?: string;
}

export const useWords = () => {
  const db = useSQLiteContext();
  const [words, setWords] = useState<WordWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. OBTENER TODAS
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

  // 2. AGREGAR
  const addWord = async (
    text: string,
    categoryId: number,
    difficulty: number,
    hint: string = ""
  ) => {
    try {
      const cleanText = text.trim();
      if (!cleanText) return { success: false, error: "Texto vacío" };

      const existing = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM words WHERE LOWER(text) = LOWER(?) AND category_id = ?`,
        [cleanText, categoryId]
      );
      if (existing && existing.count > 0)
        return { success: false, error: "Ya existe" };

      await db.runAsync(
        "INSERT INTO words (text, category_id, difficulty, hint) VALUES (?, ?, ?, ?)",
        cleanText,
        categoryId,
        difficulty,
        hint.trim()
      );
      return { success: true };
    } catch (e) {
      return { success: false, error: "Error BD" };
    }
  };

  // 3. ACTUALIZAR
  const updateWord = async (
    id: number,
    text: string,
    categoryId: number,
    difficulty: number,
    hint: string = ""
  ) => {
    try {
      await db.runAsync(
        "UPDATE words SET text = ?, category_id = ?, difficulty = ?, hint = ? WHERE id = ?",
        text.trim(),
        categoryId,
        difficulty,
        hint.trim(),
        id
      );
      return { success: true };
    } catch (e) {
      return { success: false, error: "Error BD" };
    }
  };

  // 4. ELIMINAR (¡Aquí estaba el problema antes!)
  const deleteWord = async (id: number) => {
    try {
      await db.runAsync("DELETE FROM words WHERE id = ?", id);
      // Actualizamos la lista localmente para reflejar el cambio inmediato
      await fetchAllWords();
      return true;
    } catch (error) {
      return false;
    }
  };

  const importWordsFromJson = async (jsonString: string) => {
    console.log("Importando palabras desde JSON...");
    try {
      const parsedData = JSON.parse(jsonString);

      if (!Array.isArray(parsedData)) {
        return { success: false, error: "El JSON no es una lista ([...])." };
      }

      if (parsedData.length === 0) {
        return { success: false, error: "El archivo JSON está vacío." };
      }

      let insertedCount = 0;
      let updatedCount = 0;

      // Usamos transacción: Si ocurre un error, se deshacen todos los cambios (Rollback)
      await db.withTransactionAsync(async () => {
        for (let i = 0; i < parsedData.length; i++) {
          const item = parsedData[i];
          const indexInfo = `Ítem #${i + 1}`;

          // --- VALIDACIONES ---

          // 1. Validar Texto
          if (
            !item.text ||
            typeof item.text !== "string" ||
            item.text.trim() === ""
          ) {
            throw new Error(
              `${indexInfo}: Falta la propiedad "text" o está vacía.`
            );
          }

          // 2. Validar Categoría (IMPORTANTE: Debe ser el nombre, no el ID)
          if (!item.category_name || typeof item.category_name !== "string") {
            // Ayuda extra: si el usuario puso category_id por error, le avisamos
            if (item.category_id) {
              throw new Error(
                `${indexInfo} ("${item.text}"): Tiene "category_id" pero falta "category_name". Para importar, el JSON debe tener el nombre de la categoría.`
              );
            }
            throw new Error(
              `${indexInfo} ("${item.text}"): Falta la propiedad "category_name".`
            );
          }

          // --- FIN VALIDACIONES ---
          // ... (validaciones anteriores)

          const catName = item.category_name.trim();
          const wordText = item.text.trim();

          // CAPTURAMOS EL ICONO DEL JSON (O ponemos 'list' si no viene)
          const catIcon = item.category_icon
            ? item.category_icon.trim()
            : "list";

          // A. BUSCAR O CREAR CATEGORÍA
          let catId: number;
          const existingCat = await db.getFirstAsync<{ id: number }>(
            "SELECT id FROM categories WHERE LOWER(name) = LOWER(?)",
            [catName]
          );

          if (existingCat) {
            catId = existingCat.id;
            // Opcional: Si quieres que el JSON actualice el icono de una categoría existente, descomenta esto:
            // await db.runAsync("UPDATE categories SET icon = ? WHERE id = ?", catIcon, catId);
          } else {
            // ¡AQUÍ ES DONDE SE USA EL ICONO NUEVO!
            const res = await db.runAsync(
              "INSERT INTO categories (name, icon, is_custom) VALUES (?, ?, 1)",
              catName,
              catIcon // Usamos el icono que vino en el JSON
            );
            catId = res.lastInsertRowId;
          }

          // B. BUSCAR O CREAR PALABRA
          const existingWord = await db.getFirstAsync<{ id: number }>(
            "SELECT id FROM words WHERE LOWER(text) = LOWER(?) AND category_id = ?",
            [wordText, catId]
          );

          if (existingWord) {
            // Actualizar
            await db.runAsync(
              "UPDATE words SET difficulty = ?, hint = ? WHERE id = ?",
              item.difficulty || 1,
              item.hint || "",
              existingWord.id
            );
            updatedCount++;
          } else {
            // Insertar
            await db.runAsync(
              "INSERT INTO words (text, category_id, difficulty, hint) VALUES (?, ?, ?, ?)",
              wordText,
              catId,
              item.difficulty || 1,
              item.hint || ""
            );
            insertedCount++;
          }
        }
      });

      // Si todo sale bien, refrescamos la lista
      await fetchAllWords();
      return { success: true, count: insertedCount, updated: updatedCount };
    } catch (error: any) {
      console.error("Error importando:", error);
      // Devolvemos el mensaje de error específico que lanzamos arriba
      return {
        success: false,
        error: error.message || "Error desconocido al procesar el JSON.",
      };
    }
  };

  // 6. EXPORTAR SELECTIVO
  const exportWordsAsJson = async (categoryIds: number[]) => {
    try {
      if (categoryIds.length === 0)
        return { success: false, error: "Selecciona categorías" };

      const placeholders = categoryIds.map(() => "?").join(",");
      const query = `
        SELECT w.text, w.difficulty, w.hint, c.name as category_name, c.icon as category_icon
        FROM words w
        JOIN categories c ON w.category_id = c.id
        WHERE c.id IN (${placeholders})
      `;

      const data = await db.getAllAsync(query, categoryIds);

      if (data.length === 0)
        return { success: false, error: "Categorías vacías" };

      // Usamos cacheDirectory para evitar problemas de permisos de escritura
      const fileUri = FileSystem.cacheDirectory + "imposter_pack.json";
      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(data, null, 2)
      );

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/json",
          dialogTitle: "Guardar Pack",
        });
        return { success: true };
      }
      return { success: false, error: "Compartir no soportado" };
    } catch (error) {
      console.error(error);
      return { success: false, error: "Error exportando" };
    }
  };

  return {
    words,
    isLoading,
    fetchAllWords,
    addWord,
    updateWord,
    deleteWord, // <--- ¡AQUÍ ESTÁ! Asegúrate de que esta línea exista.
    importWordsFromJson,
    exportWordsAsJson,
  };
};
