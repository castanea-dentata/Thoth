LighterPack
===========
LighterPack helps you track the gear you bring on adventures.

Under heavy development at the moment, use at your own risk. 

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
- migrate from vuex to pinia
- ~~resolve issues with various outdated npm packages~~ - completed
- ~~change database from mongodb to postgres~~ - completed

Things to Test
-----------
- A properly configured mailgunjs instance for forget password and forget username
- Upload to imgur function

Operating Systems
-----------
Tested to work on:
- macOS Tahoe 26.3.1(a)
- Proxmox running a Debian LXC