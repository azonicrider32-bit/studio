
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
  Trash2,
  Users,
  Building,
  Car,
  Dog,
  Salad,
  Camera,
  Shirt,
  Smile,
  Landmark,
  Footprints,
  Component,
  Sprout,
  Utensils,
  MountainSnow,
  Trees,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useFirebase, useUser } from '@/firebase';
import { uploadAsset } from '@/ai/flows/upload-asset-flow';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/error-handling';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';


type Asset = (typeof PlaceHolderImages)[0] & { type: 'placeholder' } | {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  category: string;
  userId: string;
  gcsPath: string;
  uploadDate: string;
  type: 'uploaded'
};

const categories = [
  { id: 'all', name: 'All Images', icon: Grid3x3 },
  { id: 'characters', name: 'Characters', icon: Users },
  { id: 'portrait', name: 'Portraits', icon: Camera },
  { id: 'landscape', name: 'Landscapes', icon: MountainSnow },
  { id: 'architecture', name: 'Architecture', icon: Building },
  { id: 'product', name: 'Products', icon: Component },
  { id: 'nature', name: 'Nature', icon: Sprout },
  { id: 'food', name: 'Food', icon: Utensils },
  { id: 'sports', name: 'Sports', icon: Footprints },
  { id: 'animal', name: 'Animals', icon: Dog },
  { id: 'texture', name: 'Textures', icon: Trees },
];

export default function AdvancedAssetPanel({ 
  onImageSelect, 
}: {
  onImageSelect: (url: string, name: string) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadedImages, setUploadedImages] = useState<Asset[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeAssetTabs, setActiveAssetTabs] = useState<Asset[]>([]);
  const [activeTab, setActiveTab] = useState<string>('library');
  
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();
  
  const allImages: Asset[] = [
      ...PlaceHolderImages.map(p => ({...p, type: 'placeholder' as const})),
      ...uploadedImages
  ];

  const filteredImages = allImages.filter(img => {
    const imageHint = 'imageHint' in img ? img.imageHint : img.category;
    const description = 'description' in img ? img.description : img.name;

    const categoryMatch = selectedCategory === 'all' || imageHint.toLowerCase().includes(selectedCategory.toLowerCase());
    const searchMatch = description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       imageHint.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const handleImageSelect = (image: Asset) => {
    onImageSelect(image.imageUrl, 'description' in image ? image.description : image.name);
  };
  
  const handleViewAssetDetails = (asset: Asset) => {
      if (!activeAssetTabs.find(tab => tab.id === asset.id)) {
          setActiveAssetTabs(prev => [...prev, asset]);
      }
      setActiveTab(asset.id);
  }
  
  const closeAssetTab = (assetId: string) => {
      setActiveAssetTabs(prev => prev.filter(tab => tab.id !== assetId));
      setActiveTab('library');
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !user || !firestore) return;
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    toast({ title: 'Upload starting...', description: `Uploading ${files.length} file(s).` });

    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
           toast({ variant: 'destructive', title: 'File too large', description: `'${file.name}' exceeds the 10MB limit.`});
           continue;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const fileDataUri = reader.result as string;
          
          try {
            const result = await uploadAsset({
              userId: user.uid,
              fileName: file.name,
              fileDataUri: fileDataUri,
            });

            if (result.error || !result.downloadURL || !result.gcsPath) {
              throw new Error(result.error || 'Upload failed to return a URL.');
            }
            
            const assetId = result.gcsPath.split('/').pop()?.split('-')[0] || `asset_${Date.now()}`;

            const newImage: Asset = {
              id: assetId,
              name: file.name.replace(/\.[^/.]+$/, ''),
              imageUrl: result.downloadURL,
              description: `Uploaded: ${file.name}`,
              category: 'uploaded',
              userId: user.uid,
              gcsPath: result.gcsPath,
              uploadDate: new Date().toISOString(),
              type: 'uploaded'
            };

            setUploadedImages(prev => [...prev, newImage]);
            toast({ title: 'Upload Successful', description: `'${file.name}' has been uploaded.` });

          } catch (uploadError) {
             handleApiError(uploadError, toast, { title: `Upload Failed for ${file.name}` });
          }
        };
        reader.onerror = (error) => {
          handleApiError(error, toast, { title: `Failed to read ${file.name}` });
        };
      }
    } catch (error) {
       handleApiError(error, toast, { title: 'Upload Error' });
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <div className="h-full w-full bg-background text-foreground flex flex-col">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-lg">
            <ImageIcon className="w-5 h-5 text-primary" />
            Asset Library
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-muted/50 h-8"
                />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex overflow-hidden">
        <div className="flex h-full w-full">
            <div className="w-16 border-r flex flex-col items-center gap-2 py-4 px-1 bg-background">
                <TooltipProvider>
                    {categories.map((category) => (
                        <Tooltip key={category.id}>
                            <TooltipTrigger asChild>
                                <Button
                                  variant={selectedCategory === category.id ? 'secondary' : 'ghost'}
                                  size="icon"
                                  onClick={() => {
                                      setSelectedCategory(category.id);
                                      setActiveTab('library');
                                  }}
                                  className="w-12 h-12 flex-col gap-1"
                                >
                                  <category.icon className="w-5 h-5" />
                                </Button>
                            </TooltipTrigger>
                             <TooltipContent side="right">
                                <p>{category.name}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                    <Separator className="my-2"/>
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <div>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="advanced-upload"
                                    disabled={isUploading || !user}
                                />
                                <label htmlFor="advanced-upload">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-12 h-12"
                                        disabled={isUploading || !user}
                                        asChild
                                    >
                                        <span>
                                        <Upload className="w-5 h-5" />
                                        </span>
                                    </Button>
                                </label>
                            </div>
                        </TooltipTrigger>
                         <TooltipContent side="right">
                            <p>Upload Assets</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <div className="flex-1 flex flex-col p-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-1 min-h-0">
                    <TabsList className="mb-4 flex-shrink-0 flex-wrap h-auto">
                        <TabsTrigger value="library">Library</TabsTrigger>
                        {activeAssetTabs.map(asset => (
                            <TabsTrigger key={asset.id} value={asset.id} className="flex items-center gap-2">
                                <span>{'name' in asset ? asset.name : asset.description}</span>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); closeAssetTab(asset.id)}}>
                                    <X className="w-3 h-3" />
                                </Button>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    
                    <TabsContent value="library" className="flex-1 overflow-y-auto">
                        {viewMode === 'grid' ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredImages.map((image) => (
                              <motion.div
                                key={image.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="group cursor-pointer"
                                onClick={() => handleViewAssetDetails(image)}
                              >
                                <Card className="overflow-hidden hover:border-primary transition-all duration-200">
                                  <div className="aspect-square relative overflow-hidden">
                                    <Image
                                      src={image.imageUrl}
                                      alt={'description' in image ? image.description : image.name}
                                      fill
                                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
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
                                <Card key={image.id} className="hover:border-primary transition-all duration-200 cursor-pointer" onClick={() => handleViewAssetDetails(image)}>
                                  <CardContent className="p-2">
                                    <div className="flex items-center gap-4">
                                      <div className="w-20 h-16 rounded-md overflow-hidden flex-shrink-0 relative">
                                        <Image
                                          src={image.imageUrl}
                                          alt={'description' in image ? image.description : image.name}
                                          fill
                                          sizes="80px"
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-sm mb-1 truncate">{'description' in image ? image.description : image.name}</h4>
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="text-xs">{'imageHint' in image ? image.imageHint : image.category}</Badge>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                            ))}
                          </div>
                        )}
                    </TabsContent>
                    
                    {activeAssetTabs.map(asset => (
                        <TabsContent key={asset.id} value={asset.id} className="flex-1 overflow-y-auto">
                            <div className="p-4 bg-muted/30 rounded-lg">
                                 <h3 className="text-xl font-bold mb-4">{'name' in asset ? asset.name : asset.description}</h3>
                                 <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2">
                                        <Image src={asset.imageUrl} width={800} height={600} alt={asset.id} className="rounded-lg w-full" />
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="font-semibold">Asset Details</h4>
                                        <p className="text-sm text-muted-foreground">This is where detailed asset views for different poses, outfits, and expressions will go.</p>
                                        <Button onClick={() => handleImageSelect(asset)}>Use This Image</Button>
                                    </div>
                                 </div>
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </div>
      </CardContent>
    </div>
  );
}
