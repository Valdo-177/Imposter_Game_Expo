import { CategoryItem } from "@/assets/utils/database";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useState } from "react";

export const useCategories = () => {
  const db = useSQLiteContext();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. OBTENER CATEGORIAS (READ)
  // Usamos useCallback para poder reutilizar esta función en el "Refresh"
  const refreshCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      // TRUCO SQL: Hacemos un LEFT JOIN para contar las palabras de una vez
      const result = await db.getAllAsync<any>(`
        SELECT c.*, COUNT(w.id) as count 
        FROM categories c
        LEFT JOIN words w ON c.id = w.category_id
        GROUP BY c.id
        ORDER BY c.id DESC; 
      `);

      // Mapeamos para convertir el 0/1 de SQLite a Boolean
      const formattedData: CategoryItem[] = result.map((item) => ({
        ...item,
        is_custom: item.is_custom === 1,
        count: item.count || 0,
      }));

      setCategories(formattedData);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  // 2. CREAR CATEGORIA (CREATE)
  const addCategory = async (name: string, icon: string) => {
    try {
      // is_custom siempre es 1 (true) porque la creó el usuario
      await db.runAsync(
        "INSERT INTO categories (name, icon, is_custom) VALUES (?, ?, 1)",
        name,
        icon
      );
      await refreshCategories(); // Recargamos la lista
      return true;
    } catch (error) {
      console.error("Error al crear:", error);
      return false;
    }
  };

  // 3. ACTUALIZAR CATEGORIA (UPDATE)
  const updateCategory = async (id: number, name: string, icon: string) => {
    try {
      await db.runAsync(
        "UPDATE categories SET name = ?, icon = ? WHERE id = ?",
        name,
        icon,
        id
      );
      await refreshCategories();
      return true;
    } catch (error) {
      console.error("Error al actualizar:", error);
      return false;
    }
  };

  // 4. ELIMINAR CATEGORIA (DELETE)
  const deleteCategory = async (id: number) => {
    try {
      // Primero borramos las palabras asociadas para no dejar basura
      await db.runAsync("DELETE FROM words WHERE category_id = ?", id);
      // Luego borramos la categoría
      await db.runAsync("DELETE FROM categories WHERE id = ?", id);

      await refreshCategories();
      return true;
    } catch (error) {
      console.error("Error al eliminar:", error);
      return false;
    }
  };

  // Carga inicial automática
  useEffect(() => {
    refreshCategories();
  }, [refreshCategories]);

  return {
    categories,
    isLoading,
    refreshCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  };
};
