pm2 stop web || true
pm2 stop api || true
pm2 delete web || true
pm2 delete api || true

if [ "$alreadyinitialized" = false ]; then
  if [ -z "$address" ]
  then
    echo "HOST=localhost" >> packages/api/.env
    echo "PORT=4000" >> packages/api/.env
    echo "BACKEND_URL='http://localhost:4000'" >> packages/api/.env
    echo "API_URL='http://localhost:4000'" >> packages/web/.env
  else
    echo "HOST='0.0.0.0'" >> packages/web/.env
    echo "API_URL='http://$address:4000'" >> packages/web/.env
    echo "BACKEND_URL='http://$address:4000'" >> packages/api/.env
    echo "INSTANCE='LOCAL'" >> packages/api/.env
    echo "KERNEL_ADDRESS='$address:8888'" >> packages/api/.env
  fi
  echo "INSTANCE='LOCAL'" >> packages/api/.env
  echo "INSTANCE='LOCAL'" >> packages/web/.env
fi

npm install yarn -g
yarn global add pm2
yarn global add concurrently
yarn global add cross-env
yarn install

yarn build-packages
pm2 start "yarn web" --name "web" --update-env
pm2 start "yarn api" --name "api" --update-env
