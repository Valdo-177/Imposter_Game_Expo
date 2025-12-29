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

export const initializeDatabase = async (db: SQLiteDatabase) => {
  try {
    await db.execAsync(`PRAGMA journal_mode = WAL;`);

    await db.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        icon TEXT, -- Para el icono de Ionicons
        is_custom INTEGER DEFAULT 0 -- 0 para las que vienen por defecto, 1 para las del usuario
    );

    CREATE TABLE IF NOT EXISTS words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        category_id INTEGER,
        difficulty INTEGER DEFAULT 1, -- 1: Fácil, 2: Medio, 3: Difícil
        FOREIGN KEY (category_id) REFERENCES categories (id)
    );
    `);

    console.log("Base de datos inicializada correctamente");
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error);
  }
};
