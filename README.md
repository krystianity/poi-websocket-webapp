# poi-websocket-webapp
EWT Project of my hons. BSc at SSU (UK)

This project contains 5 types of content:

1.) NodeJS Websocket Point of Interest Server (delivering to the Proxy or the FirstParty Application) [storing POIs with SQLite3]

2.) NodeJS Post HTTP Request <=> Websocket Proxy Server (routing between the ThirdParty Application and the Main Server)

3.) FirstParty WebApplication (working fully inside of a Leaflet.js Geolocation-Map using On-Map-Popups)

4.) ThirdParty WebApplication (works just like (3) but uses Ajax instead of Websockets that are routed through a proxy_curl.php script)

5.) ApiTest WebApplication - used to test the request options of (1)

- The app is fully functional
- Mostly done using an object oriented Javascript approach
- License is Apache 2
- Given grade was A1.
