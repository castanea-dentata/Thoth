LighterPack
===========
LighterPack helps you track the gear you bring on adventures.

I would not use this currently, many of the packages are out of date, have severe to major security vulnerabilities, and overall the codebase is a mess (because of me). I would run locally only and would not expose to the wider internet in anyway.

How to run Lighterpack
-----------
For Production:
1. Install node.js, npm, postgresql, and sudo
2. ```$ git clone https://github.com/castanea-dentata/thoth.git```
3. Install dependancies ```$ npm install```
4. Create database ```$ npm run setup```
5. Start app ```$ npm start```
6. go to http://localhost:3000

For Dev Server:
1. Install node.js, npm, postgresql, and sudo.
2. ```$ git clone https://github.com/castanea-dentata/thoth.git```
3. Install dependancies ```$ npm install```
4. Create database ```$ npm run setup```
5. Run node app.js
6. Run npm run dev
7. Visit http://localhost:8080

To-do
-----------
- migrate from vue2 to vue3 - partially completed
- migrate from webpack to vite
- resolve issues with various outdated npm packages - in progress
- change database from mongodb to postgres - in progress
- migrate from vuex to pinia


