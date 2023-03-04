import { Router } from '@vaadin/router';

export const BASE_URL: string = (import.meta.env.BASE_URL).length > 2 ? (import.meta.env.BASE_URL).slice(1,-1) : (import.meta.env.BASE_URL);

export const ROUTES = [
  {
    path: BASE_URL,
    animate: true,
    children: [
      { path: '', component: 'app-game' },
      {
        path: 'menu',
        component: 'app-menu'
      },
      {
        path: 'game',
        component: 'app-game'
      },
      {
        path: 'help',
        component: 'app-help'
      }
    ],
  },
];

export const router = new Router();
