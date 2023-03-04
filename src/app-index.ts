import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

// @ts-ignore
import { default as gameControl } from 'gamecontroller.js/src/gamecontrol.js';

// import {router, ROUTES } from './app-router';

import './pages/app-menu';
import './pages/app-game';
import './pages/app-help';
import './styles/global.scss';

@customElement('app-index')
export class AppIndex extends LitElement {
  private audioElm!: HTMLAudioElement;
  private currentScreen = '';

  get inGame() {
    return this.currentScreen === 'game';
  }

  createRenderRoot() {
    return this;
  }

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('keyup', this.onKeypress as any);

    gameControl.on('connect', (gamepad: any) => {
      gamepad.after('up', () => this.focusPrevious());
      gamepad.after('down', () => this.focusNext());
      gamepad.after('button0', () => this.onEnter());

      gamepad.after('button1', () => {
        if (this.inGame) return;
        this.onEscape();
      });

      gamepad.after('button16', () => this.onEscape());
    });
  }

  disconnectedCallback() {
    document.removeEventListener('keyup', this.onKeypress as any);
  }

  firstUpdated() {
    this.audioElm = document.querySelector('#audio') as HTMLAudioElement;
    // const outlet = document.querySelector('#app-index__main-container');

    // router.setOutlet(outlet);
    // router.setRoutes(ROUTES);

    // window.addEventListener('vaadin-router-location-changed', (event) => {
    //   console.log(event.detail.location.pathname);
    //   this.audioElm.pause();
    //   if (event.detail.location.pathname === '/game') {
    //     this.audioElm.pause();
    //   } else {
    //     this.focusFirst();
    //     this.audioElm.play();
    //   }

    //   setTimeout(() => {
    //     this.focusFirst();
    //   }, 200);
    // });
  }

  render() {
    const route = this.getCurrentRoute();

    return html`
      <div @dblclick=${() => this.onFullscreen()}>
        <main>
          <div id="app-index__main-container">
            ${route}
          </div>
        </main>
        <audio id="audio" autoplay>
          <source src="./assets/Another World.mp3" type="audio/mpeg" />
        </audio>
      </div>
    `;
  }

  getCurrentRoute() {
    switch (this.currentScreen) {
      case 'game':
        return html`<app-game></app-game>`;
      case 'help':
        return html`<app-help></app-help>`;
      default:
        return html`<app-menu></app-menu>`;
    }
  }

  onFullscreen() {
    fullscreen(this.querySelector('#app-index__main-container'));
  }

  onEscape() {
    this.currentScreen = '';
    this.requestUpdate();
  }

  onEnter() {
    if (this.inGame) return;

    const el = document.activeElement;
    const href = el?.getAttribute('data-route');

    this.currentScreen = href || '';

    if (this.inGame) {
      this.audioElm.pause();
    } else {
      this.audioElm.play();
    }

    this.requestUpdate();
  }

  onKeypress = (e: KeyboardEvent) => {
    // console.log(e.key);

    switch (e.key) {
      case 'Enter':
      case ' ':
        if (this.inGame) return;
        this.onEnter();
        break;
      case 'ArrowUp':
        if (this.inGame) return;
        this.focusPrevious();
        break;
      case 'ArrowDown':
        if (this.inGame) return;
        this.focusNext();
        break;
      case 'Escape':
        this.onEscape();
        break;
    }
  }

  // private focusFirst() {
  //   this.focusableItems[0]?.focus();
  // }

  private focusNext() {
    const index = mod(this.getFocusedElementIndex() + 1, this.focusableItems.length);
    this.focusableItems[index]?.focus();
  }

  private focusPrevious() {
    const index = mod(this.getFocusedElementIndex() - 1, this.focusableItems.length);
    this.focusableItems[index]?.focus();
  }

  private get focusableItems(): HTMLElement[] {
    return Array.from(this.querySelectorAll('a, button'));
  }

  private getFocusedElementIndex() {
    return this.focusableItems.findIndex(
      (item) => item === document.activeElement
    );
  }
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

const FULLSCREEN = [
  'requestFullscreen',
  'mozRequestFullScreen',
  'msRequestFullscreen',
  'webkitRequestFullscreen',
];

function fullscreen(elem: any, options?: any) {
  return elem[
    (FULLSCREEN as any).find((prop: string) => typeof elem[prop] === 'function')
  ]?.(options);
}
