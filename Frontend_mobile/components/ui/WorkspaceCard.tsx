import React from "react";
import { View, Text, TouchableOpacity,  } from "react-native";
import { Feather, MaterialIcons } from '@expo/vector-icons';

interface WorkspaceCardProps {
  id: string;
  name: string;
  imageUrl?: string | null; 
  memberCount: number;
  lastActive: string;
  planType?: 'Pro' | 'Enterprise' | null;
  isAdmin?: boolean;
  unreadCount?: number;
  onPress: (id: string) => void;
}

export default function WorkspaceCard({
  id,
  name,
  imageUrl,
  memberCount,
  lastActive,
  planType,
  isAdmin,
  unreadCount,
  onPress,
}: WorkspaceCardProps) {
    const defaultImage = require('../../assets/images/TeamlyImage/defaultPFpic.jpg');

    return (
        <TouchableOpacity>
            
        </TouchableOpacity>
    )
}