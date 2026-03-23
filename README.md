LighterPack
===========
LighterPack helps you track the gear you bring on adventures.

How to run Lighterpack
-----------

1. Install node.js, npm, and docker.
2. ```$ git clone https://github.com/castanea-dentata/Thoth.git```
3. Install dependancies ```$ npm install```
4. Command: docker run -d -p 27017:27017 --name lighterpack-db mongo:4.4
5. Start app ```$ npm start```
6. go to http://localhost:8080

To-do
-----------
- migrate from vue2 to vue3 - partially completed
- migrate from webpack to vite
- resolve issues with various outdated npm packages
- change database from mongodb to postgres
- migrate from vuex to pinia
