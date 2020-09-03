npm install -g pm2
npm install -g concurrently
npm install -g cross-env
npm install --unsafe-perm
pm2 stop api
pm2 stop web
pm2 delete api
pm2 delete web
pm2 start npm --name "web" -- run web
pm2 start npm --name "api" -- run api
