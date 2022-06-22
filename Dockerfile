FROM ubuntu:20.04

RUN apt-get update && yes|apt-get upgrade && \
    apt-get install -y nano && \
    apt-get install -y git && \
    apt-get install -y curl

RUN apt-get install -y wget bzip2

RUN apt-get -y install sudo

RUN apt-get update && apt-get install -y --no-install-recommends apt-utils

RUN wget https://repo.anaconda.com/miniconda/Miniconda3-py38_4.12.0-Linux-x86_64.sh && \
    bash Miniconda3-py38_4.12.0-Linux-x86_64.sh -b && \
    rm Miniconda3-py38_4.12.0-Linux-x86_64.sh

RUN apt-get install -y net-tools

RUN sudo apt-get update --fix-missing && \
    sudo apt-get install -y gcc && \
    sudo apt-get clean

RUN sudo rm -rf /var/lib/apt/lists/*

RUN sudo apt-get -y update && sudo apt-get -y upgrade && \
    sudo apt-get -y install g++

ENV PATH="/root/miniconda3/bin:${PATH}"

RUN sudo chown -R root ~/miniconda3/bin && \
    sudo chmod -R +x ~/miniconda3/bin

RUN curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash - && \
    sudo apt-get install nodejs

RUN conda install -c conda-forge jupyterlab && \
    conda install -c conda-forge dask-labextension && \
    jupyter serverextension enable dask_labextension && \
    conda install -c conda-forge jupyter_kernel_gateway && \
    conda clean -afy

ENV TZ="America/New_York"

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone && \
    sudo apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get -y install tzdata && \
    DEBIAN_FRONTEND=noninteractive apt-get dist-upgrade -yq && \
    DEBIAN_FRONT=noninteractive apt-get install -yq apt-utils && \
    dpkg-reconfigure tzdata && \
    wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add - && \
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list && \
    DEBIAN_FRONTEND=noninteractive apt-get install -yq mongodb

RUN npm install yarn -g

RUN yarn global add pm2 && \
    yarn global add concurrently && \
    yarn global add cross-env

WORKDIR "/opt"

RUN echo "Version 22.6.6-beta"

RUN pip install cytoolz && \
    pip install llvmlite --ignore-installed && \
    pip install git+https://github.com/hi-primus/optimus.git@v22.6.0-beta2#egg=pyoptimus[pandas] && \
    pip install git+https://github.com/hi-primus/optimus.git@v22.6.0-beta2#egg=pyoptimus[dask]

RUN git clone --branch develop https://github.com/hi-primus/bumblebee.git

WORKDIR "/opt/bumblebee"

RUN yarn install

RUN echo "HOST='0.0.0.0'" >> packages/web/.env && \
    echo "INSTANCE='LOCAL'" >> packages/api/.env && \
    echo "INSTANCE='LOCAL'" >> packages/web/.env

WORKDIR "/"

RUN mkdir -p /data/db

ENV PROTOCOL=https
ENV ADDRESS=localhost
ENV FRONT_PORT=3000
ENV BACK_PORT=4000

CMD ./usr/bin/mongod --fork --logpath /var/log/mongod.log && \
    echo "Initializing Bumblebee Environment" && \
    mkdir -p /opt/bumblebee/packages/api/assets/addons && \
    cd /opt/bumblebee/packages/api/assets/addons && \
    for add_on in $ADD_ONS; do \
        git clone "$add_on"; \
    done && \
    cd /opt/bumblebee && \
    echo "API_URL='$PROTOCOL://$ADDRESS'" >> packages/web/.env && \
    echo "DOCKER='TRUE'" >> packages/web/.env && \
    echo "BACKEND_URL='$PROTOCOL://$ADDRESS'" >> packages/api/.env && \
    echo "PORT='$FRONT_PORT'" >> packages/web/.env && \
    echo "PORT='$BACK_PORT'" >> packages/api/.env && \
    echo "KERNEL_ADDRESS='localhost:8888'" >> packages/api/.env && \
    echo "DB_URL='$DB_URL'" >> packages/api/.env && \
    echo "ADD_ONS='$ADD_ONS'" >> packages/web/.env && \
    echo "QUICK_USER_AUTH=$QUICK_USER_AUTH" >> packages/web/.env && \
    echo "QUICK_WORKSPACE_CREATION=$QUICK_WORKSPACE_CREATION" >> packages/web/.env && \
    pm2 stop web || true && \
    pm2 stop api || true && \
    pm2 delete web || true && \
    pm2 delete api || true && \
    pm2 start "yarn web" --name "web" --update-env && \
    pm2 start "yarn api" --name "api" --update-env && \
    echo "[Bumblebee] Web address:    $PROTOCOL://localhost:$FRONT_PORT" && \
    echo "[Bumblebee] Api address:    $PROTOCOL://$ADDRESS    Api port: $BACK_PORT" && \
    echo "[Bumblebee] Kernel address: $PROTOCOL://localhost:8888" && \
    echo "[Bumblebee] Add-ons used:   $ADD_ONS" && \
    echo "[Bumblebee] Quick used authentication used: $QUICK_USER_AUTH" >> packages/web/.env && \
    echo "[Bumblebee] Quick workspace creation used:  $QUICK_WORKSPACE_CREATION" >> packages/web/.env && \
    jupyter kernelgateway --ip=0.0.0.0 --JupyterWebsocketPersonality.list_kernels=True --KernelGatewayApp.allow_origin=* --Application.log_level=50

EXPOSE 3000:3000 4000:4000 8888:8888

# docker run --name <NAME> --network="host" -e ADDRESS=<IP> hiprimus/bumblebee:3.0
# docker run --name <NAME> -p 3000:3000 -p 4000:4000 -e ADDRESS=localhost hiprimus/bumblebee:3.0
# docker run --name <NAME> --network="host" -e ADDRESS=<IP> -e SPARK=1 hiprimus/bumblebee:3.0
# docker run --name <NAME> -p 3000:3000 -p 4000:4000 -e ADDRESS=localhost -e SPARK=1 hiprimus/bumblebee:3.0