cd ..

pm2 stop web || echo "Not found"
pm2 stop api || echo "Not found"
pm2 delete web || echo "Not found"
pm2 delete api || echo "Not found"

IF %alreadyinitialized%==False (

  IF "%address%"=="" (
    echo "HOST=localhost" >> packages/api/.env
    echo "PORT=4000" >> packages/api/.env
    echo "BACKEND_URL='http://localhost:4000'" >> packages/api/.env
    echo "API_URL='http://localhost:4000'" >> packages/web/.env
  ) ELSE (
    echo "HOST='0.0.0.0'" >> packages/web/.env
    echo "API_URL='http://$address:4000'" >> packages/web/.env
    echo "BACKEND_URL='http://$address:4000'" >> packages/api/.env
    echo "INSTANCE='LOCAL'" >> packages/api/.env
    echo "KERNEL_ADDRESS='$address:8888'" >> packages/api/.env
  )
  echo "INSTANCE='LOCAL'" >> packages/api/.env
  echo "INSTANCE='LOCAL'" >> packages/web/.env
)

npm install yarn -g
yarn global add pm2
yarn global add concurrently
yarn global add cross-env
yarn install

yarn build-packages
pm2 start "yarn web" --name "web" --update-env
pm2 start "yarn api" --name "api" --update-env

cd scripts
