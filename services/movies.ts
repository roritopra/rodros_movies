import { Client, ID, Databases } from 'react-native-appwrite';
import { eventEmitter, EVENTS } from './eventEmitter';

// Configuraciu00f3n de Appwrite
const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_MOVIES_ID = process.env.EXPO_PUBLIC_APPWRITE_MOVIES_SAVED_ID!;

// Inicializar cliente de Appwrite
const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!);

// Inicializar servicios
const database = new Databases(client);

// Interfaces para los tipos de datos
export interface CollectionMovie {
  $id: string;
  id: string;  // Campo requerido por Appwrite
  collection_id: string;  // ID de la colecciu00f3n a la que pertenece
  movie_id: number;  // ID de la pelu00edcula en TMDB
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
  added_at?: Date;  // Fecha de adición (opcional, Appwrite lo agrega automáticamente)
}

// Funciu00f3n para guardar una pelu00edcula en una colecciu00f3n
export const saveMovieToCollection = async (
  collectionId: string,
  movie: {
    id: number;
    title: string;
    poster_path: string | null;
    vote_average: number;
    release_date: string;
  }
): Promise<CollectionMovie | null> => {
  try {
    console.log('Guardando pelu00edcula en colecciu00f3n:', collectionId);
    
    // Generar un ID u00fanico para el documento
    const uniqueId = ID.unique();
    
    // Crear el documento con los campos requeridos
    // Para collection_id, necesitamos un valor que no exceda los 10 caracteres
    // Vamos a usar los primeros 10 caracteres del ID o generar un ID corto
    const shortCollectionId = collectionId.substring(0, 10);
    console.log('ID de colecciu00f3n original:', collectionId);
    console.log('ID de colecciu00f3n recortado:', shortCollectionId);
    
    const movieData = {
      id: uniqueId,
      collection_id: shortCollectionId,
      movie_id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path || '',
      vote_average: Math.round(movie.vote_average), // Convertir a entero
      release_date: movie.release_date
    };
    
    console.log('Datos a guardar en Appwrite:', movieData);
    
    const created = await database.createDocument(
      DATABASE_ID,
      COLLECTION_MOVIES_ID,
      uniqueId,
      movieData
    );
    
    console.log('Pelu00edcula guardada exitosamente:', created);
    
    // Emitir evento de pelu00edcula guardada
    eventEmitter.emit(EVENTS.MOVIE_SAVED, {
      movie: created,
      collectionId: collectionId
    });
    
    return created as unknown as CollectionMovie;
  } catch (error) {
    console.error('Error guardando pelu00edcula en colecciu00f3n:', error);
    return null;
  }
};

// Funciu00f3n para obtener las pelu00edculas de una colecciu00f3n
export const getMoviesFromCollection = async (collectionId: string): Promise<CollectionMovie[]> => {
  try {
    // Usamos el ID corto de la colecciu00f3n (primeros 10 caracteres)
    const shortCollectionId = collectionId.substring(0, 10);
    console.log('Buscando pelu00edculas con collection_id:', shortCollectionId);
    
    try {
      const result = await database.listDocuments(
        DATABASE_ID,
        COLLECTION_MOVIES_ID
        // Quitamos el filtro por ahora para evitar errores de sintaxis
      );
      
      // Filtramos manualmente los resultados
      const filteredDocuments = result.documents.filter(
        doc => doc.collection_id === shortCollectionId
      );
      
      console.log(`Encontradas ${filteredDocuments.length} pelu00edculas para la colecciu00f3n ${shortCollectionId}`);
      return filteredDocuments as unknown as CollectionMovie[];
    } catch (queryError) {
      console.error('Error en la consulta a Appwrite:', queryError);
      return [];
    }
  } catch (error) {
    console.error('Error obteniendo pelu00edculas de la colecciu00f3n:', error);
    return [];
  }
};
