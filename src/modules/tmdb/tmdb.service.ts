import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TMDbService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.themoviedb.org/3';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('app.tmdbApiKey');
    if (!apiKey) {
      throw new Error('TMDB_API_KEY not found in configuration.');
    }
    this.apiKey = apiKey;
  }

  private async get(path: string, params: Record<string, any> = {}) {
    const url = `${this.baseUrl}/${path}`;
    const response = await firstValueFrom(
      this.httpService.get(url, {
        params: { ...params, api_key: this.apiKey },
      }),
    );
    return response.data;
  }

  async searchPerson(query: string) {
    return this.get('search/person', { query });
  }

  async getPersonDetails(personId: number) {
    return this.get(`person/${personId}`);
  }

  async searchMovie(query: string) {
    return this.get('search/movie', { query });
  }

  async getMovieDetails(movieId: number) {
    return this.get(`movie/${movieId}`);
  }

  async getMovieCredits(movieId: number) {
    return this.get(`movie/${movieId}/credits`);
  }

  async getPopularMovies(page: number = 1) {
    return this.get('movie/popular', { page });
  }

  async getPopularPeople(page: number = 1) {
    return this.get('person/popular', { page });
  }

  async multiSearch(query: string, page: number = 1) {
    return this.get('search/multi', { query, page });
  }

  async getMovieRecommendations(movieId: number, page: number = 1) {
    return this.get(`movie/${movieId}/recommendations`, { page });
  }

  async getSimilarMovies(movieId: number, page: number = 1) {
    return this.get(`movie/${movieId}/similar`, { page });
  }
}
