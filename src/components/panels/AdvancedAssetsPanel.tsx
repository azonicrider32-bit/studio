
"use client"

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Image as ImageIcon, 
  Upload, 
  Search,
  Grid3x3,
  List,
  X,
  Eye,
  Download,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useFirebase, useUser } from '@/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from 'firebase/firestore';

const categories = [
  { id: 'all', name: 'All Images', icon: ImageIcon },
  { id: 'portrait', name: 'Portraits', icon: ImageIcon },
  { id: 'landscape', name: 'Landscapes', icon: ImageIcon },
  { id: 'product', name: 'Products', icon: ImageIcon },
  { id: 'nature', name: 'Nature', icon: ImageIcon },
  { id: 'sports', name: 'Sports', icon: ImageIcon },
  { id: 'animal', name: 'Animals', icon: ImageIcon },
  { id: 'food', name: 'Food', icon: ImageIcon },
  { id: 'texture', name: 'Textures', icon: ImageIcon },
  { id: 'architecture', name: 'Architecture', icon: ImageIcon },
];

export default function AdvancedAssetPanel({ 
  onImageSelect, 
  isOpen, 
  onToggle 
}: {
  onImageSelect: (url: string, name: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const { firebaseApp, firestore } = useFirebase();
  const { user } = useUser();

  const filteredImages = PlaceHolderImages.filter(img => {
    const categoryMatch = selectedCategory === 'all' || img.imageHint.toLowerCase().includes(selectedCategory.toLowerCase());
    const searchMatch = img.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       img.imageHint.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const handleImageSelect = (image: {imageUrl: string, description: string}) => {
    onImageSelect(image.imageUrl, image.description);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !user || !firebaseApp || !firestore) return;
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);

    const storage = getStorage(firebaseApp);

    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 10 * 1024 * 1024) continue; // 10MB limit

        const assetId = `asset_${Date.now()}_${Math.random()}`;
        const gcsPath = `assets/${user.uid}/${assetId}-${file.name}`;
        const storageRef = ref(storage, gcsPath);

        // 1. Await the upload
        await uploadBytes(storageRef, file);

        // 2. Get the download URL
        const downloadURL = await getDownloadURL(storageRef);

        const newImage = {
          id: assetId,
          name: file.name.replace(/\.[^/.]+$/, ''),
          imageUrl: downloadURL, // Use the public download URL
          description: `Uploaded: ${file.name}`,
          category: 'uploaded',
          userId: user.uid,
          gcsPath: gcsPath,
          uploadDate: new Date().toISOString(),
        };
        
        // 3. Store metadata in Firestore
        const assetDocRef = doc(firestore, `users/${user.uid}/assets`, assetId);
        const assetData = {
          id: assetId,
          userId: user.uid,
          gcsBucket: storage.app.options.storageBucket,
          gcsPath: gcsPath,
          downloadURL: downloadURL,
          assetType: 'image',
          uploadDate: newImage.uploadDate,
          fileSize: file.size,
          originalName: file.name,
          accessControl: 'private',
          tags: ['uploaded'],
        };
        
        await setDoc(assetDocRef, assetData, { merge: true });

        // 4. Update local state
        setUploadedImages(prev => [...prev, newImage]);
      }
    } catch (error) {
      console.error('Upload error:', error);
    }

    setIsUploading(false);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="h-full w-full bg-background text-foreground flex flex-col">
          <CardHeader className="border-b py-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-lg">
                <ImageIcon className="w-5 h-5 text-primary" />
                Asset Library
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                    placeholder="Search images..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-muted/50 h-8"
                    />
                </div>
                
                <div className="flex items-center gap-1 rounded-md bg-muted p-0.5">
                    <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-7"
                    >
                    <Grid3x3 className="w-4 h-4" />
                    </Button>
                    <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-7"
                    >
                    <List className="w-4 h-4" />
                    </Button>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggle}
                    className="h-8 w-8"
                >
                    <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 flex overflow-hidden">
            <div className="flex h-full w-full">
              <div className="w-56 border-r p-2 overflow-y-auto">
                <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2">Categories</h3>
                <div className="space-y-1">
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className="w-full justify-start gap-2"
                    >
                      <category.icon className="w-4 h-4" />
                      {category.name}
                    </Button>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="advanced-upload"
                    disabled={isUploading}
                  />
                  <label htmlFor="advanced-upload">
                    <Button
                      className="w-full"
                      variant="outline"
                      disabled={isUploading || !user}
                      asChild
                    >
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {isUploading ? 'Uploading...' : 'Upload'}
                      </span>
                    </Button>
                  </label>
                  {!user && <p className="text-xs text-muted-foreground mt-2 text-center">Sign in to upload.</p>}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <Tabs defaultValue="gallery" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="gallery">Sample Gallery</TabsTrigger>
                    <TabsTrigger value="uploaded">Uploaded ({uploadedImages.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="gallery">
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredImages.map((image) => (
                          <motion.div
                            key={image.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="group cursor-pointer"
                            onClick={() => handleImageSelect(image)}
                          >
                            <Card className="overflow-hidden hover:border-primary transition-all duration-200">
                              <div className="aspect-square relative overflow-hidden">
                                <Image
                                  src={image.imageUrl}
                                  alt={image.description}
                                  fill
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Eye className="w-8 h-8 text-white" />
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredImages.map((image) => (
                            <Card key={image.id} className="hover:border-primary transition-all duration-200 cursor-pointer" onClick={() => handleImageSelect(image)}>
                              <CardContent className="p-2">
                                <div className="flex items-center gap-4">
                                  <div className="w-20 h-16 rounded-md overflow-hidden flex-shrink-0 relative">
                                    <Image
                                      src={image.imageUrl}
                                      alt={image.description}
                                      fill
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm mb-1 truncate">{image.description}</h4>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">{image.imageHint}</Badge>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="uploaded">
                     {viewMode === 'grid' ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {uploadedImages.map((image) => (
                          <motion.div
                            key={image.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="group cursor-pointer"
                            onClick={() => handleImageSelect(image)}
                          >
                            <Card className="overflow-hidden hover:border-primary transition-all duration-200">
                              <div className="aspect-square relative overflow-hidden">
                                <Image
                                  src={image.imageUrl}
                                  alt={image.description}
                                  fill
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Eye className="w-8 h-8 text-white" />
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {uploadedImages.map((image) => (
                            <Card key={image.id} className="hover:border-primary transition-all duration-200 cursor-pointer" onClick={() => handleImageSelect(image)}>
                              <CardContent className="p-2">
                                <div className="flex items-center gap-4">
                                  <div className="w-20 h-16 rounded-md overflow-hidden flex-shrink-0 relative">
                                    <Image
                                      src={image.imageUrl}
                                      alt={image.description}
                                      fill
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm mb-1 truncate">{image.name}</h4>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className="text-xs">Uploaded</Badge>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </div>
  );
}
