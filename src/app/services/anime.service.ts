import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environment/environment';

@Injectable({
  providedIn: 'root'
})
export class AnimeService {
  private API_URL = 'https://api.jikan.moe/v4';
  private FAVORITES_URL = `${environment.apiUrl}/favorites`;
  private currentPage = 1;
  private hasNextPage = true;
  private isLoading = false;
  private favorites: any[] = [];

  constructor(private http: HttpClient) {
    this.loadFavorites();
  }

  // Carregar favoritos do JSON Server
  private loadFavorites(): void {
    this.http.get(this.FAVORITES_URL).subscribe({
      next: (res: any) => {
        this.favorites = res;
      },
      error: (err) => {
      }
    });
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
  addToFavorites(anime: any): Observable<any> {
    // Verificar se já não está nos favoritos
    if (!this.isAnimeInFavorites(anime.mal_id)) {
      return this.http.post(this.FAVORITES_URL, anime).pipe(
        tap((newFavorite: any) => {
          this.favorites.push(newFavorite);
        })
      );
    }
    return new Observable();
  }

  // Remover dos favoritos
  removeFromFavorites(animeId: number): Observable<any> {
    // Encontrar o item pelo mal_id
    const favoriteToRemove = this.favorites.find(fav => fav.mal_id === animeId);

    if (favoriteToRemove && favoriteToRemove.id) {
      return this.http.delete(`${this.FAVORITES_URL}/${favoriteToRemove.id}`).pipe(
        tap(() => {
          this.favorites = this.favorites.filter(fav => fav.mal_id !== animeId);
        })
      );
    }
    return new Observable();
  }

  // Buscar favoritos
  getFavorites(): Observable<any> {
    return this.http.get(this.FAVORITES_URL);
  }

  // Buscar favorito por ID
  getFavoriteById(animeId: number): Observable<any> {
    return this.http.get(`${this.FAVORITES_URL}?mal_id=${animeId}`);
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

  // Verificar se há próxima página
  hasMorePages(): boolean {
    return this.hasNextPage;
  }

  // buscar anime pelo nome
  searchAnime(query: string): Observable<any> {
    return this.http.get(`${this.API_URL}/anime?q=${query}`);
  }
}
