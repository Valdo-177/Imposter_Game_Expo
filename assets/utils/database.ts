import { type SQLiteDatabase } from "expo-sqlite";

export interface TodoItem {
  id: number;
  value: string;
  intValue?: number;
}

export interface CategoryItem {
  id: number;
  name: string;
  icon: string;
  is_custom: boolean;
  count?: number;
}

// (Opcional) Definimos la interfaz para las palabras para usarla en el futuro
export interface WordItem {
  id: number;
  text: string;
  hint: string; // Nuevo campo obligatorio o opcional según prefieras
  category_id: number;
  difficulty: number;
}

export const initializeDatabase = async (db: SQLiteDatabase) => {
  try {
    await db.execAsync(`PRAGMA journal_mode = WAL;`);

    // 1. Creación de Tablas (Para instalaciones NUEVAS)
    await db.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        icon TEXT, 
        is_custom INTEGER DEFAULT 0 
    );

    CREATE TABLE IF NOT EXISTS words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        hint TEXT, -- ✅ Nueva columna agregada aquí
        category_id INTEGER,
        difficulty INTEGER DEFAULT 1, -- 1: Fácil, 2: Medio, 3: Difícil
        FOREIGN KEY (category_id) REFERENCES categories (id)
    );
    `);

    // 2. MIGRACIÓN (Para usuarios que YA tienen la app instalada)
    // Intentamos agregar la columna 'hint'. Si ya existe, esto dará error,
    // pero lo capturamos en el catch para que no pase nada malo.
    try {
      await db.execAsync("ALTER TABLE words ADD COLUMN hint TEXT;");
      console.log("Columna 'hint' agregada exitosamente a la tabla words.");
    } catch (e) {
      // Si entra aquí, es probable que la columna ya exista (o la tabla sea nueva).
      // No necesitamos hacer nada.
    }

    console.log("Base de datos inicializada correctamente");
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error);
  }
};
