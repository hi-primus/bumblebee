CALL update-bumblebee.bat
cd ..

npm install yarn -g
yarn global add pm2
yarn global add concurrently
yarn global add cross-env
yarn install

cd scripts
