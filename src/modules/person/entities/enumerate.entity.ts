import * as mongoose from 'mongoose';

// Enum for person's role in the industry
export enum PersonRole {
    ACTOR = 'Actor',
    DIRECTOR = 'Director',
    PRODUCER = 'Producer',
    WRITER = 'Writer',
    CINEMATOGRAPHER = 'Cinematographer',
    COMPOSER = 'Composer',
    EDITOR = 'Editor',
    CENSOR = 'Censor',
    PRODUCTION_DESIGNER = 'Production Designer',
    COSTUME_DESIGNER = 'Costume Designer',
    SCREENWRITER = 'Screenwriter',
    OTHER = 'Other',
}
  
  // Interface for social media links
 export interface SocialMedia {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    website?: string;
  }
  
  // Interface for awards
  export interface Award {
    name: string;
    year: number;
    category?: string;
    movie?: mongoose.Schema.Types.ObjectId;
  }
