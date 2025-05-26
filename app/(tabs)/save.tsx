import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';

import { images } from '@/constants/images';
import { icons } from '@/constants/icons';
import { getSavedCollections, createSavedCollection, SavedCollection } from '@/services/collections';
import { getMoviesFromCollection, CollectionMovie } from '@/services/movies';
import { fetchMovieDetails } from '@/services/api';
import { eventEmitter, EVENTS } from '@/services/eventEmitter';

// Define interfaces para nuestros datos
type MovieForDisplay = {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
};

type CollectionData = {
  id: string;
  name: string;
  movies: MovieForDisplay[];
  expanded: boolean;
};

const Save = () => {
  const router = useRouter();
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar colecciones guardadas desde Appwrite
  // Función para cargar una colección específica con sus películas
  const loadCollectionWithMovies = async (collectionId: string) => {
    try {
      // Obtener la colección
      const savedCollections = await getSavedCollections();
      const collection = savedCollections.find(c => c.$id === collectionId);
      
      if (!collection) {
        console.error(`No se encontró la colección con ID ${collectionId}`);
        return null;
      }
      
      console.log(`Cargando películas para colección ${collection.name}...`);
      
      // Obtener películas de esta colección
      const collectionMovies = await getMoviesFromCollection(collectionId);
      console.log(`Películas obtenidas para ${collection.name}:`, collectionMovies);
      
      // Array para almacenar las películas con detalles completos
      const moviesForDisplay: MovieForDisplay[] = [];
      
      // Para cada película guardada, obtener sus detalles completos de TMDB
      for (const movie of collectionMovies) {
        try {
          // Obtener detalles completos de la película desde TMDB
          const movieDetails = await fetchMovieDetails(movie.movie_id.toString());
          
          // Agregar la película con detalles completos
          moviesForDisplay.push({
            id: movie.movie_id,
            title: movieDetails.title,
            poster_path: movieDetails.poster_path || null,
            vote_average: movieDetails.vote_average,
            release_date: movieDetails.release_date
          });
        } catch (error) {
          console.error(`Error obteniendo detalles para película ${movie.movie_id}:`, error);
          
          // Si hay error, usar los datos que tenemos en Appwrite
          moviesForDisplay.push({
            id: movie.movie_id,
            title: movie.title,
            poster_path: movie.poster_path || null,
            vote_average: movie.vote_average,
            release_date: movie.release_date
          });
        }
      }
      
      return {
        id: collection.$id,
        name: collection.name,
        movies: moviesForDisplay,
        expanded: false // Por defecto no expandida
      };
    } catch (error) {
      console.error(`Error cargando colección ${collectionId}:`, error);
      return null;
    }
  };

  // Escuchar eventos de película guardada
  useEffect(() => {
    // Función para manejar el evento de película guardada
    const handleMovieSaved = async (data: { movie: CollectionMovie, collectionId: string }) => {
      console.log('Evento de película guardada recibido:', data);
      
      try {
        // Cargar la colección actualizada
        const updatedCollection = await loadCollectionWithMovies(data.collectionId);
        
        if (updatedCollection) {
          // Actualizar la lista de colecciones
          setCollections(prevCollections => {
            // Buscar si la colección ya existe en el estado
            const collectionIndex = prevCollections.findIndex(c => c.id === updatedCollection.id);
            
            if (collectionIndex >= 0) {
              // Actualizar la colección existente manteniendo su estado de expansión
              const newCollections = [...prevCollections];
              newCollections[collectionIndex] = {
                ...updatedCollection,
                expanded: prevCollections[collectionIndex].expanded
              };
              return newCollections;
            } else {
              // Agregar la nueva colección
              return [...prevCollections, updatedCollection];
            }
          });
        }
      } catch (error) {
        console.error('Error actualizando colección después de guardar película:', error);
      }
    };
    
    // Suscribirse al evento
    const unsubscribe = eventEmitter.on(EVENTS.MOVIE_SAVED, handleMovieSaved);
    
    // Limpiar la suscripción al desmontar
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const loadCollections = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Cargando colecciones guardadas...');
        const savedCollections = await getSavedCollections();
        console.log('Colecciones obtenidas:', savedCollections);
        
        // Transformar las colecciones de Appwrite al formato que necesitamos
        const formattedCollections: CollectionData[] = [];
        
        // Para cada colección, cargar sus películas
        for (const collection of savedCollections) {
          console.log(`Cargando películas para colección ${collection.name}...`);
          
          // Obtener películas de esta colección
          const collectionMovies = await getMoviesFromCollection(collection.$id);
          console.log(`Películas obtenidas para ${collection.name}:`, collectionMovies);
          
          // Array para almacenar las películas con detalles completos
          const moviesForDisplay: MovieForDisplay[] = [];
          
          // Para cada película guardada, obtener sus detalles completos de TMDB
          for (const movie of collectionMovies) {
            try {
              // Obtener detalles completos de la película desde TMDB
              const movieDetails = await fetchMovieDetails(movie.movie_id.toString());
              
              // Agregar la película con detalles completos
              moviesForDisplay.push({
                id: movie.movie_id,
                title: movieDetails.title,
                poster_path: movieDetails.poster_path || null,
                vote_average: movieDetails.vote_average,
                release_date: movieDetails.release_date
              });
            } catch (error) {
              console.error(`Error obteniendo detalles para película ${movie.movie_id}:`, error);
              
              // Si hay error, usar los datos que tenemos en Appwrite
              moviesForDisplay.push({
                id: movie.movie_id,
                title: movie.title,
                poster_path: movie.poster_path || '',
                vote_average: movie.vote_average,
                release_date: movie.release_date
              });
            }
          }
          
          // Agregar la colección con sus películas
          formattedCollections.push({
            id: collection.$id,
            name: collection.name,
            movies: moviesForDisplay,
            expanded: false
          });
        }
        
        setCollections(formattedCollections);
      } catch (err) {
        console.error('Error cargando colecciones:', err);
        setError('Error al cargar las colecciones');
      } finally {
        setLoading(false);
      }
    };
    
    loadCollections();
  }, []);

  const toggleCollectionExpanded = (id: string) => {
    setCollections(collections.map(collection => 
      collection.id === id ? { ...collection, expanded: !collection.expanded } : collection
    ));
  };

  const handleAddCollection = async () => {
    if (newCollectionName.trim() === '') return;

    try {
      setLoading(true);
      console.log('Creando nueva colección con nombre:', newCollectionName);
      
      // Crear la colección en Appwrite
      const newCollectionData = await createSavedCollection(newCollectionName);
      console.log('Resultado de createSavedCollection:', newCollectionData);
      
      if (newCollectionData) {
        // Agregar la nueva colección al estado
        const newCollection: CollectionData = {
          id: newCollectionData.$id,
          name: newCollectionName,
          movies: [],
          expanded: false,
        };
        
        console.log('Nueva colección creada:', newCollection);
        setCollections([...collections, newCollection]);
        setNewCollectionName('');
        setShowNewCollectionModal(false);
      } else {
        setError('No se pudo crear la colección');
      }
    } catch (err) {
      console.error('Error creando colección:', err);
      setError('Error al crear la colección');
    } finally {
      setLoading(false);
    }
  };

  const renderCollection = (collection: CollectionData) => {
    return (
      <View key={collection.id} className="mb-6">
        <TouchableOpacity 
          onPress={() => toggleCollectionExpanded(collection.id)}
          className="flex-row justify-between items-center bg-dark-200 rounded-xl p-4"
        >
          <View className="flex-row items-center">
            <Image source={icons.save} className="w-6 h-6" tintColor="#ab8bff" />
            <Text className="text-white text-lg font-bold ml-3">{collection.name}</Text>
            <Text className="text-light-300 ml-2">({collection.movies.length})</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-light-300 mr-3">{collection.movies.length} movies</Text>
            <Image 
              source={icons.arrow} 
              className={`w-4 h-4 ${collection.expanded ? 'rotate-180' : 'rotate-0'}`} 
              tintColor="#a8b5db" 
            />
          </View>
        </TouchableOpacity>
        
        {collection.expanded && (
          <View className="mt-4">
            {collection.movies.length > 0 ? (
              <FlatList
                data={collection.movies}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    className="w-[30%] mr-[3%] mb-4"
                    onPress={() => router.push(`/movie/${item.id}`)}
                  >
                    <Image
                      source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }}
                      className="w-full h-40 rounded-lg"
                    />
                    <View className="bg-dark-100 rounded-b-lg p-2 -mt-1">
                      <Text className="text-white text-xs font-medium" numberOfLines={1}>{item.title}</Text>
                      <View className="flex-row items-center mt-1">
                        <Image source={icons.star} className="w-3 h-3 mr-1" tintColor="#FFD700" />
                        <Text className="text-light-300 text-xs">{item.vote_average}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id.toString()}
                numColumns={3}
                contentContainerStyle={{ paddingHorizontal: 10 }}
                ListEmptyComponent={() => (
                  <Text className="text-light-300 text-center py-4">No hay películas en esta colección</Text>
                )}
                scrollEnabled={false}
              />
            ) : (
              <Text className="text-white text-center py-4">No hay películas en esta colección</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-primary">
      <Image
        source={images.bg}
        className="absolute w-full z-0"
        resizeMode="cover"
      />
      
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="mt-20 mb-6">
          <View className="flex-row justify-between items-center">
            <Text className="text-white text-2xl font-bold">Colecciones Guardadas</Text>
            <TouchableOpacity 
              className="bg-accent py-2 px-4 rounded-full"
              onPress={() => setShowNewCollectionModal(true)}
            >
              <Text className="text-white font-medium">Nueva Colección</Text>
            </TouchableOpacity>
          </View>
          
          <Text className="text-light-300 mt-2">
            Organiza tus películas favoritas en colecciones
          </Text>
        </View>
        
        {loading ? (
          <View className="items-center justify-center mt-10">
            <ActivityIndicator size="large" color="#ab8bff" />
            <Text className="text-white mt-4">Cargando colecciones...</Text>
          </View>
        ) : error ? (
          <View className="items-center justify-center mt-10">
            <Text className="text-white text-center">{error}</Text>
            <TouchableOpacity 
              className="mt-4 bg-accent py-2 px-4 rounded-full"
              onPress={async () => {
                try {
                  setLoading(true);
                  setError(null);
                  console.log('Recargando colecciones...');
                  const savedCollections = await getSavedCollections();
                  
                  // Transformar las colecciones de Appwrite al formato que necesitamos
                  const formattedCollections: CollectionData[] = [];
                  
                  // Para cada colección, cargar sus películas
                  for (const collection of savedCollections) {
                    console.log(`Cargando películas para colección ${collection.name}...`);
                    
                    // Obtener películas de esta colección
                    const collectionMovies = await getMoviesFromCollection(collection.$id);
                    console.log(`Películas obtenidas para ${collection.name}:`, collectionMovies);
                    
                    // Array para almacenar las películas con detalles completos
                    const moviesForDisplay: MovieForDisplay[] = [];
                    
                    // Para cada película guardada, obtener sus detalles completos de TMDB
                    for (const movie of collectionMovies) {
                      try {
                        // Obtener detalles completos de la película desde TMDB
                        const movieDetails = await fetchMovieDetails(movie.movie_id.toString());
                        
                        // Agregar la película con detalles completos
                        moviesForDisplay.push({
                          id: movie.movie_id,
                          title: movieDetails.title,
                          poster_path: movieDetails.poster_path || null,
                          vote_average: movieDetails.vote_average,
                          release_date: movieDetails.release_date
                        });
                      } catch (error) {
                        console.error(`Error obteniendo detalles para película ${movie.movie_id}:`, error);
                        
                        // Si hay error, usar los datos que tenemos en Appwrite
                        moviesForDisplay.push({
                          id: movie.movie_id,
                          title: movie.title,
                          poster_path: movie.poster_path || null,
                          vote_average: movie.vote_average,
                          release_date: movie.release_date
                        });
                      }
                    }
                    
                    // Agregar la colección con sus películas
                    formattedCollections.push({
                      id: collection.$id,
                      name: collection.name,
                      movies: moviesForDisplay,
                      expanded: false
                    });
                  }
                  
                  setCollections(formattedCollections);
                } catch (err) {
                  console.error('Error recargando colecciones:', err);
                  setError('Error al recargar colecciones');
                } finally {
                  setLoading(false);
                }
              }}
            >
              <Text className="text-white font-medium">Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : collections.length === 0 ? (
          <View className="items-center justify-center mt-10">
            <Text className="text-white text-center">No tienes colecciones guardadas</Text>
            <TouchableOpacity 
              className="mt-4 bg-accent py-2 px-4 rounded-full"
              onPress={() => setShowNewCollectionModal(true)}
            >
              <Text className="text-white font-medium">Crear Colección</Text>
            </TouchableOpacity>
          </View>
        ) : (
          collections.map(renderCollection)
        )}
      </ScrollView>
      
      {/* Modal para crear nueva colección */}
      <Modal
        visible={showNewCollectionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNewCollectionModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/70">
          <View className="bg-dark-200 w-4/5 p-6 rounded-xl">
            <Text className="text-white text-xl font-bold mb-4">Nueva Colección</Text>
            
            <TextInput
              className="bg-dark-100 text-white p-3 rounded-lg mb-4"
              placeholder="Nombre de la colección"
              placeholderTextColor="#a8b5db"
              value={newCollectionName}
              onChangeText={setNewCollectionName}
            />
            
            <View className="flex-row justify-end">
              <TouchableOpacity 
                className="mr-4 py-2 px-4"
                onPress={() => {
                  setNewCollectionName('');
                  setShowNewCollectionModal(false);
                }}
              >
                <Text className="text-light-300">Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="bg-accent py-2 px-4 rounded-lg"
                onPress={handleAddCollection}
                disabled={newCollectionName.trim() === ''}
              >
                <Text className="text-white font-medium">Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Save;