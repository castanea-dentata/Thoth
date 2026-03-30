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
5. Run npm run dev
6. Visit http://localhost:8080

For Docker
1. ```$ git clone https://github.com/castanea-dentata/thoth.git```
2. docker compose run --rm app npx prisma migrate deploy
3. docker compose up -d
4. Visit http://localhost:3000
5. **WARNING** The postgresql database is created with the default password 'lighterpack'. Make sure to change this password immediately.
    - sudo -i -u postgres
    - psql
    - \password lighterpack
    - \q

Completed
-----------
- ~~migrate from vue2 to vue3~~ - completed
- ~~migrate from vuex to pinia~~ - completed
- ~~resolve issues with various outdated npm packages~~ - completed
- ~~change database from mongodb to postgres~~ - completed
- ~~migrate from webpack to vite~~ - completed

To-do
-----------
- all security vulnerabilities from npm audit are fixed, still upgrading outdated packages.
    - had to stop upgrading outdated packages, too many breaking issues at the moment, will come back to this.
- implement a local image upload feature instead of using imgur, imgur uploads do not function, and the feature will not work.

Broken Things
-----------
- Imgur uploads (broken on the original app, see above for future plans)

Things to Test
-----------
- A properly configured mailgunjs instance for forget password and forget username

Operating Systems
-----------
Tested to work on:
- macOS Tahoe 26.3.1(a)
- Proxmox running a Debian LXC
- Docker