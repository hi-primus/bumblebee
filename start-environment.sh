git reset --hard origin/develop-3.0
git pull
npm install
npm run build-packages
pm2 stop api
pm2 stop web
pm2 delete api
pm2 delete web
pm2 start npm --name "web" -- run web
pm2 start npm --name "api" -- run api
cd
pip install --upgrade --force-reinstall git+https://github.com/ironmussa/Optimus.git@develop-3.0
pip3 install --upgrade --force-reinstall git+https://github.com/ironmussa/Optimus.git@develop-3.0
jupyter kernelgateway --ip=0.0.0.0 --JupyterWebsocketPersonality.list_kernels=True --KernelGatewayApp.allow_origin='*'
