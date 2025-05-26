import {
  View,
  Text,
  Image,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Alert
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";

import { icons } from "@/constants/icons";
import useFetch from "@/services/useFetch";
import { fetchMovieDetails } from "@/services/api";
import { getSavedCollections, createSavedCollection, SavedCollection, incrementCollectionCount } from "@/services/collections";
import { saveMovieToCollection } from "@/services/movies";

interface MovieInfoProps {
  label: string;
  value?: string | number | null;
}

const MovieInfo = ({ label, value }: MovieInfoProps) => (
  <View className="flex-col items-start justify-center mt-5">
    <Text className="text-light-200 font-normal text-sm">{label}</Text>
    <Text className="text-light-100 font-bold text-sm mt-2">
      {value || "N/A"}
    </Text>
  </View>
);

const Details = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false);
  const [collections, setCollections] = useState<SavedCollection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [collectionLoading, setCollectionLoading] = useState(false);

  const { data: movie, loading: movieLoading } = useFetch(() =>
    fetchMovieDetails(id as string)
  );
  
  // Cargar colecciones guardadas
  useEffect(() => {
    const loadCollections = async () => {
      try {
        setCollectionLoading(true);
        const savedCollections = await getSavedCollections();
        setCollections(savedCollections);
      } catch (error) {
        console.error('Error cargando colecciones:', error);
        Alert.alert('Error', 'No se pudieron cargar las colecciones');
      } finally {
        setCollectionLoading(false);
      }
    };

    loadCollections();
  }, []);
  
  // Función para guardar película en una colección
  const handleSaveToCollection = async () => {
    if (!selectedCollectionId || !movie) return;
    
    try {
      setLoading(true);
      
      // Preparar datos de la película para guardar
      const movieData = {
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        vote_average: movie.vote_average,
        release_date: movie.release_date || ''
      };
      
      // Guardar la película en la colección seleccionada
      const result = await saveMovieToCollection(selectedCollectionId, movieData);
      
      if (result) {
        // Incrementar el contador de la colección
        await incrementCollectionCount(selectedCollectionId);
        
        // Actualizar la lista de colecciones
        const updatedCollections = collections.map(collection => 
          collection.$id === selectedCollectionId 
            ? { ...collection, count: collection.count + 1 }
            : collection
        );
        setCollections(updatedCollections);
        
        Alert.alert('Éxito', `${movie.title} se ha guardado en la colección`);
        setShowSaveModal(false);
      } else {
        throw new Error('No se pudo guardar la película');
      }
    } catch (error) {
      console.error('Error guardando película:', error);
      Alert.alert('Error', 'No se pudo guardar la película');
    } finally {
      setLoading(false);
    }
  };

  // Función para crear una nueva colección
  const handleCreateCollection = async () => {
    if (newCollectionName.trim() === '') return;
    
    try {
      setLoading(true);
      
      // Crear nueva colección
      const newCollection = await createSavedCollection(newCollectionName);
      
      if (newCollection) {
        // Actualizar la lista de colecciones
        setCollections([...collections, newCollection]);
        setSelectedCollectionId(newCollection.$id);
        setShowCreateCollectionModal(false);
        
        // Mostrar mensaje de éxito
        Alert.alert('Éxito', `Colección ${newCollectionName} creada correctamente`);
      }
    } catch (error) {
      console.error('Error creando colección:', error);
      Alert.alert('Error', 'No se pudo crear la colección');
    } finally {
      setLoading(false);
      setNewCollectionName('');
    }
  };

  if (movieLoading)
    return (
      <SafeAreaView className="bg-primary flex-1">
        <ActivityIndicator size="large" color="#ab8bff" />
      </SafeAreaView>
    );

  return (
    <View className="bg-primary flex-1">
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <View>
          <Image
            source={{
              uri: `https://image.tmdb.org/t/p/w500${movie?.poster_path}`,
            }}
            className="w-full h-[550px]"
            resizeMode="stretch"
          />

          <TouchableOpacity className="absolute bottom-5 right-5 rounded-full size-14 bg-white flex items-center justify-center">
            <Image
              source={icons.play}
              className="w-6 h-7 ml-1"
              resizeMode="stretch"
            />
          </TouchableOpacity>
        </View>

        <View className="flex-col items-start justify-center mt-5 px-5">
          <Text className="text-white font-bold text-xl">{movie?.title}</Text>
          <View className="flex-row items-center gap-x-1 mt-2">
            <Text className="text-light-200 text-sm">
              {movie?.release_date?.split("-")[0]} •
            </Text>
            <Text className="text-light-200 text-sm">{movie?.runtime}m</Text>
          </View>

          <View className="flex-row items-center bg-dark-100 px-2 py-1 rounded-md gap-x-1 mt-2">
            <Image source={icons.star} className="size-4" />

            <Text className="text-white font-bold text-sm">
              {Math.round(movie?.vote_average ?? 0)}/10
            </Text>

            <Text className="text-light-200 text-sm">
              ({movie?.vote_count} votes)
            </Text>
          </View>

          <MovieInfo label="Overview" value={movie?.overview} />
          <MovieInfo
            label="Genres"
            value={movie?.genres?.map((g) => g.name).join(" • ") || "N/A"}
          />

          <View className="flex flex-row justify-between w-1/2">
            <MovieInfo
              label="Budget"
              value={`$${(movie?.budget ?? 0) / 1_000_000} million`}
            />
            <MovieInfo
              label="Revenue"
              value={`$${Math.round(
                (movie?.revenue ?? 0) / 1_000_000
              )} million`}
            />
          </View>

          <MovieInfo
            label="Production Companies"
            value={
              movie?.production_companies?.map((c) => c.name).join(" • ") ||
              "N/A"
            }
          />
          
          {/* Botones de acciones */}
          <View className="flex-row justify-between mt-8 mb-4">
            <TouchableOpacity 
              className="bg-dark-200 rounded-lg px-4 py-3 flex-1 mr-2 items-center"
              onPress={() => setShowSaveModal(true)}
              disabled={loading}
            >
              <View className="flex-row items-center">
                <Image source={icons.save} className="w-5 h-5 mr-2" tintColor="#ab8bff" />
                <Text className="text-white font-medium">Guardar</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        className="absolute bottom-7 left-0 right-0 mx-5 bg-accent rounded-lg py-3.5 flex flex-row items-center justify-center z-50"
        onPress={router.back}
      >
        <Image
          source={icons.arrow}
          className="size-5 mr-1 mt-0.5 rotate-180"
          tintColor="#fff"
        />
        <Text className="text-white font-semibold text-base">Go Back</Text>
      </TouchableOpacity>
      
      {/* Modal para guardar en colección */}
      <Modal
        visible={showSaveModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/70">
          <View className="bg-dark-200 w-4/5 p-6 rounded-xl">
            <Text className="text-white text-xl font-bold mb-4">Guardar en colección</Text>
            
            {collectionLoading ? (
              <ActivityIndicator size="small" color="#ab8bff" />
            ) : collections.length === 0 ? (
              <View>
                <Text className="text-light-300 mb-4">No tienes colecciones. Crea una nueva.</Text>
                <TouchableOpacity 
                  className="bg-accent py-3 px-4 rounded-lg items-center mb-4"
                  onPress={() => {
                    setShowSaveModal(false);
                    setShowCreateCollectionModal(true);
                  }}
                >
                  <Text className="text-white font-medium">Crear colección</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={collections}
                keyExtractor={(item) => item.$id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    className={`py-3 px-4 rounded-lg mb-2 flex-row items-center justify-between ${selectedCollectionId === item.$id ? 'bg-accent/20 border border-accent' : 'bg-dark-100'}`}
                    onPress={() => setSelectedCollectionId(item.$id)}
                  >
                    <View className="flex-row items-center flex-1">
                      <View className={`w-5 h-5 rounded-sm mr-3 items-center justify-center ${selectedCollectionId === item.$id ? 'bg-accent' : 'border border-light-300'}`}>
                        {selectedCollectionId === item.$id && (
                          <Text className="text-white text-xs font-bold">✓</Text>
                        )}
                      </View>
                      <Text className="text-white font-medium">{item.name}</Text>
                    </View>
                    <Text className="text-light-300 text-xs">{item.count || 0} películas</Text>
                  </TouchableOpacity>
                )}
                style={{ maxHeight: 200 }}
                className="mb-4"
              />
            )}
            
            {collections.length > 0 && (
              <View className="flex-row justify-between mb-4">
                <TouchableOpacity 
                  className="bg-dark-100 py-3 px-4 rounded-lg flex-1 mr-2 items-center"
                  onPress={() => setShowCreateCollectionModal(true)}
                >
                  <Text className="text-white font-medium">Nueva colección</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  className={`py-3 px-4 rounded-lg flex-1 ml-2 items-center ${!selectedCollectionId || loading ? 'bg-accent/50' : 'bg-accent'}`}
                  onPress={handleSaveToCollection}
                  disabled={!selectedCollectionId || loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <View className="flex-row items-center">
                      <Text className="text-white font-medium">Guardar</Text>
                      {selectedCollectionId && (
                        <View className="ml-2 w-4 h-4 rounded-full bg-white items-center justify-center">
                          <Text className="text-accent text-xs font-bold">✓</Text>
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}
            
            <TouchableOpacity 
              className="py-2 px-4"
              onPress={() => setShowSaveModal(false)}
            >
              <Text className="text-light-300 text-center">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Modal para crear nueva colección */}
      <Modal
        visible={showCreateCollectionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCreateCollectionModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/70">
          <View className="bg-dark-200 w-4/5 p-6 rounded-xl">
            <Text className="text-white text-xl font-bold mb-4">Nueva colección</Text>
            
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
                  setShowCreateCollectionModal(false);
                }}
              >
                <Text className="text-light-300">Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="bg-accent py-2 px-4 rounded-lg"
                onPress={handleCreateCollection}
                disabled={newCollectionName.trim() === '' || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-medium">Crear</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Details;