On Background Service:
1.create 'babylog.service' in /lib/systemd/system mind directory structures
2.add '#!/usr/bin/env node' on top of srv.js
3.chmod +x srv.js
4.systemctl daemon-reload
5.systemctl enable babylog.service
6.systemctl start babylog.service
7.see journaled message with 'journalctl -lf -u babylog.service'

On Database:
1.'sudo apt install postgresql-10'
2.'su - postgres'
3.'psql'
4.'create role '$USER' createdb password xx'
5.exit psql
6.login with $USER
7.'createdb baby'
8.psql -d baby
9.'create table milk (time timestamp with time zone, milk integer);'
10.'create table poops (time timestamp with time zone, poops integer);'
11.'alter table poops add constraint poops_gt_0 check(poops>0);'
12.'create index on milk time desc;'
13.'create index on poops time desc;'
14.'\q' exit psql
show constraints and indexes of table: '\d+ <tablename>'

On NodeJS app:
1.sudo apt install node
2.npm i node-postgres
3.npm i express
4.create 'public' folder in the same directory of srv.js
5.create 'style.css' in 'public' folder
