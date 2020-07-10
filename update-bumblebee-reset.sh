git reset --hard origin/develop-3.0
git pull
npm install
npm run build-packages
pm2 restart api
pm2 restart web
