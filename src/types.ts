export interface GalleryImage {
  id: string;
  url: string;
  category: 'Wedding' | 'Engagement' | 'Elopement';
  title: string;
  location: string;
}

export interface Testimonial {
  id: string;
  name: string;
  text: string;
  location: string;
}

export interface Package {
  id: string;
  name: string;
  price: string;
  features: string[];
  description: string;
}
