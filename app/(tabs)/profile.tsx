import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';

import { images } from '@/constants/images';
import { icons } from '@/constants/icons';

// Define Movie interface para mostrar en la UI
type Movie = {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
};

// Perfil de usuario simulado
const mockProfile = {
  name: 'Usuario',
  username: '@usuario',
  bio: 'Amante del cine y las series',
  avatar: 'https://ui-avatars.com/api/?name=Usuario&background=ab8bff&color=fff',
  stats_watched: 12,
  stats_favorites: 8,
  stats_lists: 3
};

// Películas favoritas simuladas
const mockFavorites: Movie[] = [
  {
    id: 667538,
    title: 'Transformers: Rise of the Beasts',
    poster_path: '/gPbM0MK8CP8A174rmUwGsADNYKD.jpg',
    vote_average: 7.5,
    release_date: '2023-06-06'
  },
  {
    id: 385687,
    title: 'Fast X',
    poster_path: '/fiVW06jE7z9YnO4trhaMEdclSiC.jpg',
    vote_average: 7.1,
    release_date: '2023-05-17'
  },
  {
    id: 447365,
    title: 'Guardians of the Galaxy Vol. 3',
    poster_path: '/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg',
    vote_average: 8.0,
    release_date: '2023-05-03'
  }
];

// Películas vistas simuladas
const mockWatched: Movie[] = [
  {
    id: 667538,
    title: 'Transformers: Rise of the Beasts',
    poster_path: '/gPbM0MK8CP8A174rmUwGsADNYKD.jpg',
    vote_average: 7.5,
    release_date: '2023-06-06'
  },
  {
    id: 385687,
    title: 'Fast X',
    poster_path: '/fiVW06jE7z9YnO4trhaMEdclSiC.jpg',
    vote_average: 7.1,
    release_date: '2023-05-17'
  },
  {
    id: 447365,
    title: 'Guardians of the Galaxy Vol. 3',
    poster_path: '/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg',
    vote_average: 8.0,
    release_date: '2023-05-03'
  },
  {
    id: 594767,
    title: 'Shazam! Fury of the Gods',
    poster_path: '/A3ZbZsmsvNGdprRi2lKgGEeVLEH.jpg',
    vote_average: 6.8,
    release_date: '2023-03-15'
  },
  {
    id: 502356,
    title: 'The Super Mario Bros. Movie',
    poster_path: '/qNBAXBIQlnOThrVvA6mA2B5ggV6.jpg',
    vote_average: 7.8,
    release_date: '2023-04-05'
  }
];

const Profile = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('favorites');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const renderMovieItem = ({ item }: { item: Movie }) => (
    <TouchableOpacity 
      className="w-[30%] mr-[3%] mb-4"
      onPress={() => router.push(`/movie/${item.id}`)}
    >
      <Image
        source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }}
        className="w-full h-40 rounded-lg"
        resizeMode="cover"
      />
      <Text className="text-white text-sm mt-2 font-medium" numberOfLines={1}>
        {item.title}
      </Text>
      <View className="flex-row items-center mt-1">
        <Image source={icons.star} className="w-3 h-3" />
        <Text className="text-light-300 text-xs ml-1">{item.vote_average}</Text>
      </View>
    </TouchableOpacity>
  );
  
  const renderTabContent = () => {
    const data = activeTab === 'favorites' ? mockFavorites : mockWatched;
    
    if (loading) {
      return <ActivityIndicator size="large" color="#ab8bff" className="mt-10" />;
    }
    
    if (error) {
      return <Text className="text-white text-center mt-5">{error}</Text>;
    }
    
    if (data.length === 0) {
      return (
        <Text className="text-white text-center mt-5">
          {activeTab === 'favorites' ? 'No tienes películas favoritas aún.' : 'No has marcado películas como vistas aún.'}
        </Text>
      );
    }
    
    return (
      <FlatList
        data={data}
        renderItem={renderMovieItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        scrollEnabled={false}
        className="mt-2 pb-32"
      />
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
        {/* Header with profile info */}
        <View className="mt-20 items-center">
          <View className="items-center">
            <Image
              source={{ uri: mockProfile.avatar }}
              className="w-24 h-24 rounded-full border-2 border-accent"
            />
            <Text className="text-white text-xl font-bold mt-3">{mockProfile.name}</Text>
            <Text className="text-light-300 text-sm">{mockProfile.username}</Text>
            <Text className="text-white text-center mt-3 px-8">{mockProfile.bio}</Text>
          </View>
          
          {/* Stats */}
          <View className="flex-row justify-between w-full mt-6 px-4 py-4 bg-dark-200 rounded-xl">
            <View className="items-center">
              <Text className="text-white text-xl font-bold">{mockProfile.stats_watched}</Text>
              <Text className="text-light-300 text-sm">Watched</Text>
            </View>
            <View className="items-center">
              <Text className="text-white text-xl font-bold">{mockProfile.stats_favorites}</Text>
              <Text className="text-light-300 text-sm">Favorites</Text>
            </View>
            <View className="items-center">
              <Text className="text-white text-xl font-bold">{mockProfile.stats_lists}</Text>
              <Text className="text-light-300 text-sm">Lists</Text>
            </View>
          </View>
        </View>
        
        {/* Tabs */}
        <View className="flex-row mt-8 mb-4 bg-dark-200 rounded-full p-1">
          <TouchableOpacity
            onPress={() => setActiveTab('favorites')}
            className={`flex-1 py-3 rounded-full ${
              activeTab === 'favorites' ? 'bg-accent' : ''
            }`}
          >
            <Text
              className={`text-center font-medium ${
                activeTab === 'favorites' ? 'text-white' : 'text-light-300'
              }`}
            >
              Favorites
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('watched')}
            className={`flex-1 py-3 rounded-full ${
              activeTab === 'watched' ? 'bg-accent' : ''
            }`}
          >
            <Text
              className={`text-center font-medium ${
                activeTab === 'watched' ? 'text-white' : 'text-light-300'
              }`}
            >
              Watched
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Movie List */}
        <View className="mt-2">
          {renderTabContent()}
        </View>
      </ScrollView>
    </View>
  );
};

export default Profile;