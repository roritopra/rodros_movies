import { Client, ID, Databases } from 'react-native-appwrite';

// Configuración de Appwrite
const PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID as string;
const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID as string;
const COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_SAVED_MOVIES_COLLECTION_ID as string;

// Inicializar cliente de Appwrite
const client = new Client();
client
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject(PROJECT_ID);

// Inicializar servicios
const database = new Databases(client);

// Interfaces para los tipos de datos
export interface SavedCollection {
  $id: string;
  id: string;  // Campo requerido por Appwrite
  name: string;
  count: number;
}

// Funciones para manejar colecciones guardadas
export const getSavedCollections = async (): Promise<SavedCollection[]> => {
  try {
    const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID);
    return result.documents as unknown as SavedCollection[];
  } catch (error) {
    console.error("Error getting saved collections:", error);
    return [];
  }
};

export const createSavedCollection = async (name: string): Promise<SavedCollection | null> => {
  try {
    console.log('Creando colección con nombre:', name);
    console.log('DATABASE_ID:', DATABASE_ID);
    console.log('COLLECTION_ID:', COLLECTION_ID);
    
    // Generar un ID único para el documento
    const uniqueId = ID.unique();
    
    const collectionData = {
      id: uniqueId,  // Campo requerido por Appwrite
      name,
      count: 0
    };
    console.log('Datos de la colección a crear:', collectionData);
    
    const created = await database.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      uniqueId,  // Usar el mismo ID que asignamos al campo 'id'
      collectionData
    );
    
    console.log('Colección creada exitosamente:', created);
    return created as unknown as SavedCollection;
  } catch (error) {
    console.error("Error creating saved collection:", error);
    return null;
  }
};

// Función para incrementar el contador de películas en una colección
export const incrementCollectionCount = async (collectionId: string): Promise<boolean> => {
  try {
    // Primero obtenemos la colección actual
    const collection = await database.getDocument(DATABASE_ID, COLLECTION_ID, collectionId);
    
    if (!collection) return false;
    
    // Incrementamos el contador
    const updatedCount = (collection.count || 0) + 1;
    
    // Actualizamos el documento
    await database.updateDocument(
      DATABASE_ID,
      COLLECTION_ID,
      collectionId,
      { count: updatedCount }
    );
    
    return true;
  } catch (error) {
    console.error('Error actualizando contador de colección:', error);
    return false;
  }
};
