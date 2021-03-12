#!/bin/bash
cd ..

pm2 stop web || true
pm2 stop api || true
pm2 delete web || true
pm2 delete api || true
yarn build-packages
pm2 start "yarn web" --name "web" --update-env
pm2 start "yarn api" --name "api" --update-env

cd scripts
