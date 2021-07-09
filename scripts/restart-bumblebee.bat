cd ..

pm2 stop web || echo "Not found"
pm2 stop api || echo "Not found"
pm2 delete web || echo "Not found"
pm2 delete api || echo "Not found"
yarn build-packages
pm2 start "yarn web" --name "web" --update-env
pm2 start "yarn api" --name "api" --update-env

cd scripts
