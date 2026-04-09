import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { Ionicons, Feather, FontAwesome } from '@expo/vector-icons';
import { useState } from "react";
import { useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import Avatar from './Avatar';

export default function Header() {
    const [searchQuery, setSearchQuery] = useState('')

    const handleSearch = (text: string) => {
       setSearchQuery(text);
    };

    const handleProfilePress = () => {
       console.log("รอทำ Profile")
    }

    const handleFilterPress = () => {
       console.log("รอทำตัวกรอง")
    }

    return (
        <LinearGradient colors={['#062b50', '#0a427a']} className="pt-14 pb-5 px-5 overflow-hidden rounded-b-2xl shadow-sm">
           <View className="absolute -top-16 -right-10 w-64 h-64 bg-white/10 rounded-full" />
           <View className="absolute top-10 -right-20 w-48 h-48 bg-white/5 rounded-full" />
           <View className="relative z-10 flex-col gap-5">
               <View className="flex-row justify-between items-center">
                   
                   {/*รูป Logo*/}
                   <Image 
                   source={require('../../assets/images/TeamlyImage/TeamlyLogo.png')} 
                   className="w-28 h-8"
                   resizeMode="contain"/>

                   {/*รูป Profile*/}
                    <Avatar 
                        initials="YO" 
                        isOnline={true} 
                        size={40} 
                        onPress={handleProfilePress} 
                    />
               </View>

            <View className="flex-row items-center gap-3">  
              <View className="flex-1 flex-row items-center bg-white rounded-full px-4 py-3">
                <Feather name="search" size={20} color="#9ca3af" />
                
                <TextInput 
                  className="flex-1 ml-2 text-base text-gray-800"
                  placeholder="Search announcements..."
                  placeholderTextColor="#9ca3af"
                  value={searchQuery}
                  onChangeText={handleSearch}
                  returnKeyType="search"
                />
                
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Feather name="x-circle" size={18} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>
              
              <TouchableOpacity 
                    onPress={handleFilterPress}
                    className="w-12 h-12 bg-white rounded-full items-center justify-center flex-row gap-1">
                <Ionicons name="filter" size={20} color="#062b50" />
                <Feather name="chevron-down" size={14} color="#062b50" />
              </TouchableOpacity>
           </View>
           
           </View> 
        </LinearGradient>
    )
} 