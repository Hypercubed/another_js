import { Route, Router } from '@vaadin/router';

export const BASE_URL: string =
  import.meta.env.BASE_URL.length > 2
    ? import.meta.env.BASE_URL.slice(1, -1)
    : import.meta.env.BASE_URL;

export const ROUTES: Route[] = [
  {
    path: BASE_URL,
    animate: true,
    children: [
      { path: '', component: 'app-menu' },
      {
        path: 'game',
        component: 'app-game',
        action: async () => {
          await import('./pages/app-game');
        },
      },
      {
        path: 'options',
        component: 'app-options',
        action: async () => {
          await import('./pages/app-options');
        },
      },
      {
        path: 'help',
        component: 'app-help',
        action: async () => {
          await import('./pages/app-help');
        },
      },
      {
        path: 'credits',
        component: 'app-credits',
        action: async () => {
          await import('./pages/app-credits.js');
        },
      },
      {
        path: 'load',
        component: 'app-load',
        action: async () => {
          await import('./pages/app-load');
        },
      },
    ],
  },
];

export const router = new Router();
