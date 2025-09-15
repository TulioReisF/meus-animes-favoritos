import { Component, OnInit } from '@angular/core';
import { AnimeService } from 'src/app/services/anime.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-lista-animes',
  templateUrl: './lista-animes.component.html',
  styleUrls: ['./lista-animes.component.scss']
})
export class ListaAnimesComponent implements OnInit {
  favorites: any[] = [];
  loading = true;
  searchTerm: string = '';

  constructor(
    private animeService: AnimeService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadFavorites();
  }

  loadFavorites(): void {
    this.loading = true;
    this.animeService.getFavorites().subscribe({
      next: (res: any) => {
        this.favorites = res;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.showError('Erro ao carregar favoritos');
      }
    });
  }

  get filteredFavorites(): any[] {
    if (!this.searchTerm) {
      return this.favorites;
    }

    const searchTermLower = this.searchTerm.toLowerCase();
    return this.favorites.filter(anime =>
      anime.title.toLowerCase().includes(searchTermLower) ||
      (anime.title_english && anime.title_english.toLowerCase().includes(searchTermLower))
    );
  }

  removeFromFavorites(anime: any): void {
    this.animeService.removeFromFavorites(anime.mal_id).subscribe({
      next: () => {
        this.favorites = this.favorites.filter(fav => fav.mal_id !== anime.mal_id);
        this.showSuccess('Anime removido dos favoritos!');
      },
      error: (err) => {
        this.showError('Erro ao remover anime');
      }
    });
  }

  clearSearch(): void {
    this.searchTerm = '';
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }
}
