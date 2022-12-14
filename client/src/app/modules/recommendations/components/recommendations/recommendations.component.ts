import {
  Component,
  ElementRef,
  HostListener,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';

import { QueryService } from 'src/app/shared/services/query.service';
import { TransferDataService } from 'src/app/shared/services/transfer-data.service';
import { RecommendationsService } from '../../services/recommendations.service';

import {
  AverageSongFeatures,
  Recommendation
} from 'src/app/shared/models/models';
import { CreatePlaylistResponse } from 'src/app/shared/models/spotify-models';

@Component({
  selector: 'app-recommendations',
  templateUrl: './recommendations.component.html',
  styleUrls: ['./recommendations.component.css'],
})
export class RecommendationsComponent {
  constructor(
    private query: QueryService,
    private transfer: TransferDataService,
    private recommend: RecommendationsService
  ) {}

  showAverageFeatures: boolean = true;
  showAverageFeaturesChanged: boolean = false;
  showAverageFeaturesDropdown: boolean = false;

  data: any = this.transfer.getData();
  selectedPlaylist: any = this.data.selectedPlaylist;
  averageFeatures: AverageSongFeatures = this.data.averageFeatures;
  songsRetrieved: number = this.data.tracks.length;
  artistsRetrieved: number = this.data.artists.length;
  genresRetrieved: number = this.data.genres.length;

  recommendationsLength: number = 0;
  recommendations: Recommendation[] = [];
  gettingMoreRecommendations: boolean = false;

  playingTrack: string = '';
  @ViewChild('songPreview')
  songPreview!: ElementRef;

  selectedTracks: string[] = [];
  @ViewChildren('checkboxes') checkboxes!: QueryList<ElementRef>;
  selectAll: boolean = false;
  addedTracks: string[] = [];
  @ViewChild('thisPlaylist') thisPlaylist!: ElementRef;
  @ViewChild('newPlaylist') newPlaylist!: ElementRef;

  async ngOnInit() {
    this.recommend.recommendationsChanged.subscribe((length) => {
      this.recommendationsLength = length;
    });

    if (window.innerWidth < 1000) {
      this.showAverageFeatures = false;
      this.showAverageFeaturesDropdown = true;
    }

    // Set title marquee
    setTitleMarquee('#playlist_details > h5', this.selectedPlaylist.name, 200);

    // Receive data from promise
    var recommendations = await this.recommend.getRecommendations(this.data);
    this.recommendations.push(...recommendations);

    // Set marquee
    setTimeout(() => {
      setTrackMarquee();
    }, 0);
  }

  async moreRecommendations() {
    this.recommendationsLength = 0;
    this.gettingMoreRecommendations = true;

    var recommendations = await this.recommend.getRecommendations();

    recommendations.forEach((r) => {
      if (!this.recommendations.some((t) => t.id === r.id))
        this.recommendations.push(r);
    });

    setTimeout(() => {
      setTrackMarquee();
    }, 0);

    this.gettingMoreRecommendations = false;
  }

  onShowAverageFeatures() {
    this.showAverageFeatures = !this.showAverageFeatures;
    this.showAverageFeaturesChanged = true;
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    setTrackMarquee();

    if (window.innerWidth < 1000) {
      if (this.showAverageFeaturesChanged) return;
      this.showAverageFeatures = false;
      this.showAverageFeaturesDropdown = true;
    } else {
      this.showAverageFeatures = true;
      this.showAverageFeaturesChanged = false;
      this.showAverageFeaturesDropdown = false;
    }
  }

  onCheckboxChange(e: any, id: string) {
    e.target.checked
      ? this.selectedTracks.push(id)
      : (this.selectedTracks = this.selectedTracks.filter((t) => t !== id));
  }

  onSelectAll() {
    this.selectAll = !this.selectAll;
    this.checkboxes.forEach((checkbox) => {
      checkbox.nativeElement.checked = this.selectAll;
    });

    this.selectAll
      ? (this.selectedTracks = this.recommendations.map((t) => t.id))
      : (this.selectedTracks = []);
  }

  async addThisPlaylist(newPlaylistId?: string) {
    var id = this.selectedPlaylist.id;
    var uris = [];

    if (newPlaylistId) {
      id = newPlaylistId;
      uris = this.selectedTracks.map((t) => `spotify:track:${t}`);
    } else {
      this.thisPlaylist.nativeElement.disabled = true;
      this.thisPlaylist.nativeElement.innerHTML = 'Adding...';

      for (const track of this.selectedTracks) {
        if (!this.addedTracks.includes(track)) {
          uris.push(`spotify:track:${track}`);
          this.addedTracks.push(track);
        }
      }

      if (uris.length === 0) {
        this.thisPlaylist.nativeElement.disabled = false;
        this.thisPlaylist.nativeElement.innerHTML = 'This playlist';
        return;
      }
    }

    var url = `https://api.spotify.com/v1/playlists/${id}/tracks`;
    while (uris.length > 0) {
      await this.query.post(url, { uris: uris.splice(0, 100) });
    }

    if (this.thisPlaylist.nativeElement.disabled) {
      this.thisPlaylist.nativeElement.disabled = false;
      this.thisPlaylist.nativeElement.innerHTML = 'This playlist';
    } else {
      this.newPlaylist.nativeElement.disabled = false;
      this.newPlaylist.nativeElement.innerHTML = 'New playlist';
    }
  }

  async addNewPlaylist() {
    this.newPlaylist.nativeElement.disabled = true;
    this.newPlaylist.nativeElement.innerHTML = 'Adding...';

    var userId = localStorage.getItem('userId');
    var url = `https://api.spotify.com/v1/users/${userId}/playlists`;
    var body = {
      name: `Recommendations for ${this.selectedPlaylist.name}`,
      description:
        'Recommendations retrieved from Recommendations for Spotify. Accessible at https://codypeters.dev/recommendations.',
    };
    var response = <CreatePlaylistResponse>await this.query.post(url, body);

    if (!response.error) this.addThisPlaylist(response.id);
  }

  previewHandler(url: string) {
    if (this.songPreview.nativeElement.src === url) url = '';

    this.songPreview.nativeElement.src = url;
    this.playingTrack = url;

    if (url) this.songPreview.nativeElement.play();
  }
}
