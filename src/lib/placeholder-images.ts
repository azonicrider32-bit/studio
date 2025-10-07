import data from './placeholder-images.json';

type AssetDetails = {
  [key: string]: string;
}

export type ImagePlaceholder = {
  id: string;
  name?: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  category: string;
  type?: 'character' | 'standard';
  views?: AssetDetails;
  expressions?: AssetDetails;
  outfits?: AssetDetails;
};

export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages;
