npm run build-packages
pm2 stop api
pm2 stop web
pm2 delete api
pm2 delete web
pm2 start npm --name "web" -- run web
pm2 start npm --name "api" -- run api
