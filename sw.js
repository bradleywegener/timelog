const CACHE_NAME = 'timelog-v0.2.3';

const APP_FILES = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './version.json',

  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];


/* ==================================================
   INSTALL
   ================================================== */

self.addEventListener(
  'install',
  event => {

    event.waitUntil(

      fetch('./version.json', {
        cache: 'no-store'
      })
        .then(response => {

          if (!response.ok) {
            throw new Error(
              'Could not load version.json'
            );
          }

          return response.json();

        })
        .then(versionData => {

          CACHE_NAME =
            `timelog-v${versionData.version}`;

          return caches
            .open(CACHE_NAME)
            .then(cache =>
              cache.addAll(APP_FILES)
            );

        })

    );

    self.skipWaiting();

  }
);


/* ==================================================
   ACTIVATE
   ================================================== */

self.addEventListener(
  'activate',
  event => {

    event.waitUntil(

      caches
        .keys()
        .then(cacheNames => {

          return Promise.all(

            cacheNames
              .filter(
                cacheName =>
                  cacheName.startsWith(
                    'timelog-'
                  )
                  &&
                  cacheName !==
                    CACHE_NAME
              )
              .map(
                cacheName =>
                  caches.delete(
                    cacheName
                  )
              )

          );

        })

        .then(() =>
          self.clients.claim()
        )

    );

  }
);


/* ==================================================
   FETCH
   ================================================== */

self.addEventListener(
  'fetch',
  event => {

    /*
     * Only handle GET requests.
     */

    if (
      event.request.method !== 'GET'
    ) {
      return;
    }


    /*
     * Don't intercept external
     * resources such as Google Fonts.
     */

    const url =
      new URL(
        event.request.url
      );

    if (
      url.origin !==
      self.location.origin
    ) {
      return;
    }


    /*
     * Network first:
     *
     * Try to get the newest version
     * from Netlify.
     *
     * If offline, fall back to cache.
     */

    event.respondWith(

      fetch(event.request)
        .then(response => {

          if (
            response &&
            response.status === 200
          ) {

            const responseClone =
              response.clone();

            caches
              .open(CACHE_NAME)
              .then(cache => {

                cache.put(
                  event.request,
                  responseClone
                );

              });

          }

          return response;

        })

        .catch(() =>
          caches.match(
            event.request
          )
        )

    );

  }
);