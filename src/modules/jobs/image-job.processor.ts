import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { HttpService } from '@nestjs/axios';
import { MoviesService } from '../movie/movie.service';
import { PersonService } from '../person/person.service';
import { ImageJobData } from './jobs.service';
import * as fs from 'fs';
import * as path from 'path';
import { lastValueFrom } from 'rxjs';

@Processor('image-processing')
export class ImageJobProcessor extends WorkerHost {
  constructor(
    private readonly httpService: HttpService,
    private readonly moviesService: MoviesService,
    private readonly personService: PersonService,
  ) {
    super();
  }

  async process(job: Job<ImageJobData>): Promise<any> {
    const { imageUrl, tmdbId, type, imagePath } = job.data;
    const destination = path.join('./uploads', imagePath);

    try {
      const response = await lastValueFrom(this.httpService.get(imageUrl, { responseType: 'stream' }));
      const writer = fs.createWriteStream(destination);
      response.data.pipe(writer);

      await new Promise<void>((resolve, reject) => {
        writer.on('finish', () => resolve());
        writer.on('error', reject);
      });

      if (type === 'poster' || type === 'backdrop') {
        const updateDto = type === 'poster' ? { posterUrl: imagePath } : { backdropUrl: imagePath };
        await this.moviesService.updateByTmdbId(tmdbId, updateDto);
      } else if (type === 'profile') {
        await this.personService.updateByTmdbId(tmdbId, { profilePath: imagePath });
      }

      return { success: true, path: destination };
    } catch (error) {
      console.error(`Failed to download image for job ${job.id}:`, error);
      throw error;
    }
  }
}
