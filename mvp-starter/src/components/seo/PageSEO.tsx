import { Helmet } from 'react-helmet-async';
import { BASE_URL, DEFAULT_DESCRIPTION, SOCIAL_IMAGE } from '@/config/brand';

interface PageSEOProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
}

export const PageSEO = ({ 
  title, 
  description, 
  path = '', 
  image = SOCIAL_IMAGE,
  type = 'website' 
}: PageSEOProps) => {
  const baseUrl = BASE_URL || '';
  const fullUrl = `${baseUrl}${path}`;
  const fullImageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description || DEFAULT_DESCRIPTION} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description || DEFAULT_DESCRIPTION} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description || DEFAULT_DESCRIPTION} />
      <meta name="twitter:image" content={fullImageUrl} />
    </Helmet>
  );
};
