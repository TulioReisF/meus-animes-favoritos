import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environment/environment';

@Injectable({
  providedIn: 'root'
})
export class AnimeService {
  private API_URL = 'https://api.jikan.moe/v4';
  private favoritesKey = 'favorites';
  private currentPage = 1;
  private hasNextPage = true;
  private isLoading = false;
  private favorites: any[] = [];

  constructor(private http: HttpClient) {
    this.loadFavorites();
  }

  // Carregar favoritos do localStorage
  private loadFavorites(): void {
    this.favorites = JSON.parse(localStorage.getItem(this.favoritesKey) || '[]');
  }

  private saveFavorites(): void {
    localStorage.setItem(this.favoritesKey, JSON.stringify(this.favorites));
  }

  // Verificar se um anime já está nos favoritos
  isAnimeInFavorites(animeId: number): boolean {
    return this.favorites.some(fav => fav.mal_id === animeId);
  }

  // Filtrar animes que não estão nos favoritos
  filterOutFavorites(animes: any[]): any[] {
    return animes.filter(anime => !this.isAnimeInFavorites(anime.mal_id));
  }

  // Adicionar aos favoritos
  addToFavorites(anime: any): void {
    if (!this.isAnimeInFavorites(anime.mal_id)) {
      this.favorites.push(anime);
      this.saveFavorites();
    }
  }

  // Remover dos favoritos
  removeFromFavorites(animeId: number): void {
    this.favorites = this.favorites.filter(fav => fav.mal_id !== animeId);
    this.saveFavorites();
  }

  // Buscar favoritos
  getFavorites(): any[] {
    return this.favorites;
  }

  // Buscar favorito por ID
  getFavoriteById(animeId: number): any {
    return this.favorites.find(fav => fav.mal_id === animeId);
  }

  // pegar animes populares com paginação e filtro de favoritos
  getTopAnimes(page: number = 1): Observable<any> {
    return this.http.get(`${this.API_URL}/top/anime?page=${page}`).pipe(
      tap((response: any) => {
        response.data = this.filterOutFavorites(response.data);
        this.hasNextPage = response.pagination.has_next_page;
        this.currentPage = page;
      })
    );
  }

  // Carregar próxima página
  loadNextPage(): Observable<any> {
    if (this.isLoading || !this.hasNextPage) {
      return new Observable();
    }

    this.isLoading = true;
    const nextPage = this.currentPage + 1;

    return this.http.get(`${this.API_URL}/top/anime?page=${nextPage}`).pipe(
      tap((response: any) => {
        response.data = this.filterOutFavorites(response.data);
        this.hasNextPage = response.pagination.has_next_page;
        this.currentPage = nextPage;
        this.isLoading = false;
      })
    );
  }

  hasMorePages(): boolean {
    return this.hasNextPage;
  }

  searchAnime(query: string): Observable<any> {
    return this.http.get(`${this.API_URL}/anime?q=${query}`);
  }
}
