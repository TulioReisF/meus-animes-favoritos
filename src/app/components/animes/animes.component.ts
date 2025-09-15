import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { AnimeService } from 'src/app/services/anime.service';

@Component({
  selector: 'app-animes',
  templateUrl: './animes.component.html',
  styleUrls: ['./animes.component.scss']
})
export class AnimesComponent implements OnInit, AfterViewInit, OnDestroy {
  animes: any[] = [];
  currentIndex = 0;
  currentAnime: any = null;
  isLoading = true;
  noAnimesAvailable = false;
  @ViewChild('animeCardContainer', { static: false }) animeCardContainer!: ElementRef;
  isDragging = false;
  isSwipingLeft = false;
  isSwipingRight = false;

  private startX = 0;
  private currentX = 0;
  private velocity = 0;
  private lastX = 0;
  private lastTime = 0;
  private swipeThreshold = 100;
  private throwThreshold = 5;

  private cardElement: HTMLElement | null = null;
  private isAnimating = false;

  constructor(protected animeService: AnimeService) {}

  ngOnInit(): void {
    this.loadAnimes();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.animeCardContainer && this.animeCardContainer.nativeElement) {
        this.cardElement = this.animeCardContainer.nativeElement.querySelector('.anime-card');
      }
    }, 0);
  }

  ngOnDestroy(): void {
    this.cardElement = null;
  }

 loadAnimes(): void {
    this.isLoading = true;
    this.animeService.getTopAnimes().subscribe({
      next: (res) => {
        this.animes = res.data;
        this.checkAnimesAvailability();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
      }
    });
  }

  checkAnimesAvailability(): void {
    if (this.animes.length === 0) {
      this.noAnimesAvailable = true;
      this.currentAnime = null;
    } else {
      this.noAnimesAvailable = false;
      this.currentAnime = this.animes[this.currentIndex];
    }
  }

  nextAnime(): void {
    this.currentIndex++;

    this.loadMoreAnimesIfNeeded();

    if (this.currentIndex < this.animes.length) {
      this.currentAnime = this.animes[this.currentIndex];
      this.resetCardPosition();
    } else {
      this.checkAnimesAvailability();
    }
    this.isSwipingLeft = false;
    this.isSwipingRight = false;
    this.isAnimating = false;
  }

  loadMoreAnimesIfNeeded(): void {
    if (this.currentIndex >= this.animes.length - 5 && this.animeService.hasMorePages() && !this.noAnimesAvailable) {
      this.animeService.loadNextPage().subscribe({
        next: (res) => {
          if (res.data && res.data.length > 0) {
            this.animes = [...this.animes, ...res.data];
          }
        },
      });
    }
  }

  private getCardElement(): HTMLElement | null {
    if (!this.cardElement && this.animeCardContainer && this.animeCardContainer.nativeElement) {
      this.cardElement = this.animeCardContainer.nativeElement.querySelector('.anime-card');
    }
    return this.cardElement;
  }

  resetCardPosition(): void {
    const cardElement = this.getCardElement();
    if (cardElement) {
      cardElement.style.transition = 'none';
      cardElement.style.transform = 'translateX(0) rotate(0deg)';

      setTimeout(() => {
        cardElement.style.transition = '';
      }, 50);
    }
  }

  dislike(): void {
    this.nextAnime();
  }

like(): void {
  if (this.currentAnime) {
    this.animeService.addToFavorites(this.currentAnime);
  }
  this.nextAnime();
}

  onPanStart(event: any): void {
    if (this.isAnimating) return;

    const cardElement = this.getCardElement();
    if (!cardElement) {
      return;
    }

    this.isDragging = true;
    this.startX = event.center.x;
    this.lastX = this.startX;
    this.lastTime = Date.now();
    this.velocity = 0;

    this.isSwipingLeft = false;
    this.isSwipingRight = false;

    cardElement.style.transition = 'none';
  }

  onPanMove(event: any): void {
    if (!this.isDragging || this.isAnimating) return;

    const cardElement = this.getCardElement();
    if (!cardElement) return;

    const currentTime = Date.now();
    const currentX = event.center.x;

    if (currentTime > this.lastTime) {
      this.velocity = (currentX - this.lastX) / (currentTime - this.lastTime);
    }

    this.lastX = currentX;
    this.lastTime = currentTime;

    this.currentX = currentX - this.startX;

    const resistance = 0.5;
    const limitedX = this.currentX * resistance;
    const rotation = limitedX * 0.1;

    cardElement.style.transform = `translateX(${limitedX}px) rotate(${rotation}deg)`;

    this.isSwipingLeft = this.currentX < -50;
    this.isSwipingRight = this.currentX > 50;
  }

  onPanEnd(event: any): void {
    if (!this.isDragging || this.isAnimating) return;

    const cardElement = this.getCardElement();
    if (!cardElement) return;

    this.isDragging = false;

    const shouldComplete =
      Math.abs(this.currentX) > this.swipeThreshold ||
      Math.abs(this.velocity) > this.throwThreshold;

    if (shouldComplete) {
      this.completeSwipe();
    } else {
      this.returnToCenter();
    }
  }

  completeSwipe(): void {
    const cardElement = this.getCardElement();
    if (!cardElement) return;

    this.isAnimating = true;

    const isRight = this.currentX > 0 || this.velocity > 0;

    cardElement.style.transition = 'transform 0.5s ease-out';

    if (isRight) {
      cardElement.style.transform = `translateX(1000px) rotate(30deg)`;
      setTimeout(() => {
        this.like();
      }, 300);
    } else {
      cardElement.style.transform = `translateX(-1000px) rotate(-30deg)`;
      setTimeout(() => {
        this.dislike();
      }, 300);
    }
  }

  returnToCenter(): void {
    const cardElement = this.getCardElement();
    if (!cardElement) return;

    this.isAnimating = true;

    cardElement.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    cardElement.style.transform = 'translateX(0) rotate(0deg)';

    setTimeout(() => {
      this.isSwipingLeft = false;
      this.isSwipingRight = false;
      this.isAnimating = false;
    }, 300);
  }
}
