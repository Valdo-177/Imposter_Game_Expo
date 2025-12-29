import React from "react";
import { View } from "react-native";
import Skeleton from "./Skeleton";

const CategorySkeleton = () => {
  return (
    <View className="mb-4 bg-[#1a1a1a] rounded-2xl p-4 flex-row items-center border border-[#4e387f1c]">
      <Skeleton className="w-12 h-12 mr-4 rounded-full" />
      <View className="flex-1 gap-2">
        <Skeleton className="w-3/4 h-5 rounded-md" />
        <Skeleton className="w-1/3 h-3 rounded-md" />
      </View>
      <Skeleton className="w-8 h-8 ml-2 rounded-full" />
    </View>
  );
};

export default CategorySkeleton;
