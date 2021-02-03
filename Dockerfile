FROM ubuntu:20.04

RUN apt-get update && yes|apt-get upgrade && \
    apt-get install -y nano && \
    apt-get install -y git && \
    apt-get install -y curl

RUN apt-get install -y wget bzip2

RUN apt-get -y install sudo

RUN apt-get update && apt-get install -y --no-install-recommends apt-utils

RUN wget https://repo.anaconda.com/archive/Anaconda3-2020.07-Linux-x86_64.sh && \
    bash Anaconda3-2020.07-Linux-x86_64.sh -b && \
    rm Anaconda3-2020.07-Linux-x86_64.sh

RUN apt-get install -y net-tools

RUN sudo apt-get update --fix-missing && \
    sudo apt-get install -y gcc && \
    sudo apt-get clean

RUN sudo rm -rf /var/lib/apt/lists/*

RUN sudo apt-get -y update && sudo apt-get -y upgrade && \
    sudo apt-get -y install g++

ENV PATH="/root/anaconda3/bin:${PATH}"

RUN sudo chown -R root ~/anaconda3/bin && \
    sudo chmod -R +x ~/anaconda3/bin

RUN curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash - && \
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

RUN echo "Version 3.0.0 - Feb 1 2021"

RUN pip install cytoolz --no-cache-dir && \
    pip install git+https://github.com/ironmussa/dateinfer.git --no-cache-dir && \
    pip install git+https://github.com/ironmussa/Optimus.git@develop-3.0 --no-cache-dir

RUN git clone --branch develop-3.0 https://github.com/ironmussa/Bumblebee.git

WORKDIR "/opt/Bumblebee"

RUN yarn install

RUN echo "HOST='0.0.0.0'" >> packages/web/.env && \
    echo "INSTANCE='LOCAL'" >> packages/api/.env && \
    echo "INSTANCE='LOCAL'" >> packages/web/.env

WORKDIR "/"

RUN mkdir -p /data/db

CMD ./usr/bin/mongod --fork --logpath /var/log/mongod.log && \
    cd /opt/Bumblebee && \
    if [[ -n "$SPARK" ]] ; then \
      echo "Loading spark dependencies" && \
      pip install git+https://github.com/ironmussa/Optimus.git@develop-3.0[spark] --no-cache-dir \
    fi
    echo "Initializing Bumblebee Environment" && \
    echo "API_URL='http://$ADDRESS:4000'" >> packages/web/.env && \
    echo "DOCKER='TRUE'" >> packages/web/.env && \
    echo "BACKEND_URL='http://$ADDRESS:4000'" >> packages/api/.env && \
    echo "KERNEL_ADDRESS='localhost:8888'" >> packages/api/.env && \
    pm2 stop web || true && \
    pm2 stop api || true && \
    pm2 delete web || true && \
    pm2 delete api || true && \
    pm2 start "yarn web" --name "web" --update-env && \
    pm2 start "yarn api" --name "api" --update-env && \
    echo "[Bumblebee] Web process at: http://$ADDRESS:3000" && \
    jupyter kernelgateway --JupyterWebsocketPersonality.list_kernels=True --KernelGatewayApp.allow_origin='*'

EXPOSE 3000:3000 4000:4000

# docker run --name <NAME> --network="host" -e ADDRESS=<IP> ironmussa/bumblebee:develop-3.0
# docker run --name <NAME> -P -e ADDRESS=localhost ironmussa/bumblebee:develop-3.0
# docker run --name <NAME> --network="host" -e ADDRESS=<IP> -e SPARK=1 ironmussa/bumblebee:develop-3.0
# docker run --name <NAME> -P -e ADDRESS=localhost -e SPARK=1 ironmussa/bumblebee:develop-3.0
