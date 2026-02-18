const collectionRoute = {
	path: '/collections/:collection',
	component: () => import('./pages/collection-layout.vue'),

	children: [
		{
			path: '',
			component: () => import('./pages/collection.vue'),
		},
		{
			path: ':id',
			component: () => import('./pages/document.vue'),
		}
	]
}

export default {
  routes: routes => [
		...routes,
		collectionRoute,
  ],
}
