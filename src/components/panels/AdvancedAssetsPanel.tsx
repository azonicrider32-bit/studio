
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
  Edit,
  Plus,
  Copy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PlaceHolderImages, ImagePlaceholder } from '@/lib/placeholder-images';
import { useFirebase, useUser } from '@/firebase';
import { uploadAsset } from '@/ai/flows/upload-asset-flow';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/error-handling';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';

type Asset = ImagePlaceholder;
type AssetDetails = { [key: string]: string };

const categories = [
  { id: 'all', name: 'All Images', icon: Grid3x3 },
  { id: 'characters', name: 'Characters', icon: Users },
  { id: 'portrait', name: 'Portraits', icon: Camera },
  { id: 'landscape', name: 'Landscapes', icon: MountainSnow },
  { id: 'automotive', name: 'Automotive', icon: Car },
  { id: 'architecture', name: 'Architecture', icon: Building },
  { id: 'product', name: 'Products', icon: Component },
  { id: 'nature', name: 'Nature', icon: Sprout },
  { id: 'food', name: 'Food', icon: Utensils },
  { id: 'sports', name: 'Sports', icon: Footprints },
  { id: 'animal', name: 'Animals', icon: Dog },
  { id: 'texture', name: 'Textures', icon: Trees },
];

const AssetDetailSection: React.FC<{
  title: string;
  assets?: AssetDetails;
  onThumbnailClick: (url: string) => void;
  activeThumbnail: string;
}> = ({ title, assets, onThumbnailClick, activeThumbnail }) => {
  if (!assets || Object.keys(assets).length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-foreground text-sm">{title}</h4>
      <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
        {Object.entries(assets).map(([key, url]) => (
          <div key={key} className="space-y-1 cursor-pointer group" onClick={() => onThumbnailClick(url)}>
            <div className={cn(
                "aspect-square rounded-md overflow-hidden border bg-muted hover:border-primary transition-all ring-2",
                activeThumbnail === url ? "ring-primary" : "ring-transparent"
            )}>
              <Image src={url} alt={`${title} - ${key}`} width={80} height={80} className="object-cover w-full h-full transition-transform group-hover:scale-105" />
            </div>
            <p className="text-xs text-muted-foreground text-center capitalize truncate">{key.replace(/([A-Z])/g, ' $1')}</p>
          </div>
        ))}
      </div>
    </div>
  );
};


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
  const [activePreviews, setActivePreviews] = useState<{[assetId: string]: string}>({});
  
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();
  
  const allImages: Asset[] = [
      ...PlaceHolderImages,
      ...uploadedImages
  ];

  const filteredImages = allImages.filter(img => {
    const categoryMatch = selectedCategory === 'all' || img.category?.toLowerCase() === selectedCategory.toLowerCase();
    const searchMatch = img.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (img.name && img.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                       img.imageHint.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const handleImageSelect = (image: Asset, viewUrl?: string) => {
    onImageSelect(viewUrl || image.imageUrl, image.name || image.description);
  };
  
  const handleViewAssetDetails = (asset: Asset) => {
      if (!activeAssetTabs.find(tab => tab.id === asset.id)) {
          setActiveAssetTabs(prev => [...prev, asset]);
      }
      setActiveTab(asset.id);
      if (!activePreviews[asset.id]) {
          setActivePreviews(prev => ({...prev, [asset.id]: asset.imageUrl}));
      }
  }
  
  const closeAssetTab = (assetId: string) => {
      setActiveAssetTabs(prev => prev.filter(tab => tab.id !== assetId));
      if (activeTab === assetId) {
          setActiveTab('library');
      }
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
              imageHint: 'custom upload',
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
                    <TabsList className="mb-4 flex-shrink-0 flex-wrap h-auto justify-start">
                        <TabsTrigger value="library">Library</TabsTrigger>
                        {activeAssetTabs.map(asset => (
                            <TabsTrigger key={asset.id} value={asset.id} className="flex items-center gap-2">
                                <span>{asset.name || asset.description}</span>
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
                                      alt={image.description}
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
                                          alt={image.description}
                                          fill
                                          sizes="80px"
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
                    
                    {activeAssetTabs.map(asset => (
                        <TabsContent key={asset.id} value={asset.id} className="flex-1 overflow-y-auto">
                           <ScrollArea className="h-full pr-4">
                            <div className="p-1 space-y-6">
                               <div className="space-y-1">
                                    <h3 className="text-xl font-bold">{asset.name}</h3>
                                    <p className="text-sm text-muted-foreground">{asset.description}</p>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="aspect-video w-full relative bg-muted rounded-lg overflow-hidden border">
                                        <Image src={activePreviews[asset.id] || asset.imageUrl} layout="fill" objectFit="contain" alt="Main asset preview" />
                                    </div>

                                    <div className="space-y-4">
                                      <AssetDetailSection title="Character Views" assets={asset.views} onThumbnailClick={(url) => setActivePreviews(p => ({...p, [asset.id]: url}))} activeThumbnail={activePreviews[asset.id] || ''} />
                                      <AssetDetailSection title="Expressions" assets={asset.expressions} onThumbnailClick={(url) => setActivePreviews(p => ({...p, [asset.id]: url}))} activeThumbnail={activePreviews[asset.id] || ''} />
                                      <AssetDetailSection title="Outfits" assets={asset.outfits} onThumbnailClick={(url) => setActivePreviews(p => ({...p, [asset.id]: url}))} activeThumbnail={activePreviews[asset.id] || ''} />
                                      <AssetDetailSection title="Vehicle Angles" assets={asset.views} onThumbnailClick={(url) => setActivePreviews(p => ({...p, [asset.id]: url}))} activeThumbnail={activePreviews[asset.id] || ''} />
                                      <AssetDetailSection title="Vehicle Interior" assets={asset.interior} onThumbnailClick={(url) => setActivePreviews(p => ({...p, [asset.id]: url}))} activeThumbnail={activePreviews[asset.id] || ''} />
                                      <AssetDetailSection title="Seasons" assets={asset.seasons} onThumbnailClick={(url) => setActivePreviews(p => ({...p, [asset.id]: url}))} activeThumbnail={activePreviews[asset.id] || ''} />
                                      <AssetDetailSection title="Landscape Angles" assets={asset.angles} onThumbnailClick={(url) => setActivePreviews(p => ({...p, [asset.id]: url}))} activeThumbnail={activePreviews[asset.id] || ''} />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-2">
                                     <Popover>
                                        <PopoverTrigger asChild>
                                           <Button className="w-full">
                                                <Plus className="w-4 h-4 mr-2"/>
                                                Use This Image
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 p-2">
                                            <div className="flex flex-col gap-1">
                                                <Button variant="ghost" className="w-full justify-start" onClick={() => handleImageSelect(asset, activePreviews[asset.id])}>
                                                    <Copy className="w-4 h-4 mr-2"/>
                                                    Add to Current Project
                                                </Button>
                                                <Button variant="ghost" className="w-full justify-start">
                                                    <Plus className="w-4 h-4 mr-2"/>
                                                    Start New Project
                                                </Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    <Button variant="outline" className="w-full">
                                        <Edit className="w-4 h-4 mr-2"/>
                                        Edit Asset
                                    </Button>
                                </div>
                            </div>
                           </ScrollArea>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </div>
      </CardContent>
    </div>
  );
}
