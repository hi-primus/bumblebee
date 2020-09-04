if [ -z "$address" ]
then
  echo "HOST='0.0.0.0'" >> packages/web/.env
  echo "API_URL='http://$address:4000'" >> packages/web/.env
  echo "KERNEL_ADDRESS='$address:8888'" >> packages/api/.env
else
  echo "HOST=localhost" >> packages/api/.env
fi

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
