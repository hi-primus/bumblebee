npm install yarn -g
yarn global add pm2
yarn global add concurrently
yarn global add cross-env
yarn install
pm2 stop api
pm2 stop web
pm2 delete api
pm2 delete web
pm2 start "yarn web" --name "web"
pm2 start "yarn api" --name "api"
