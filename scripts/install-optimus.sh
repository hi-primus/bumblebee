#!/bin/bash
echo 'Install spark support? [y/N]'
read answer
if echo "$answer" | grep -iq "^y" ;then
  spark=true
else
  spark=false
fi

# TO-DO: conda support on bash

coiled=false
coiledgpu=false
rapids=false

# echo 'Install coiled support with GPU features? [y/N]'
# read answer
# if echo "$answer" | grep -iq "^y" ;then
#   coiledgpu=true
# else
#   coiledgpu=false
# fi

# if [ "$coiledgpu" = false ]; then
#   echo 'Install coiled support without GPU features? [y/N]'
#   read answer
#   if echo "$answer" | grep -iq "^y" ;then
#     coiled=true
#   else
#     coiled=false
#   fi
# fi

# echo 'Use rapids (Local GPU)? [y/N]'
# read answer
# if echo "$answer" | grep -iq "^y" ;then
#   rapids=true
# else
#   rapids=false
# fi

if [ "$coiled" = true ]; then
  echo "Getting conda env from optimus/default on Coiled"
  coiled install optimus/default
  conda activate coiled-optimus-default
elif [ "$coiledgpu" = true ]; then
  echo "Getting conda env from optimus/default on Coiled"
  coiled install optimus/gpu
  conda activate coiled-optimus-gpu
elif [ "$rapids" = true ]; then
  echo "Creating rapids conda env"
  conda create --name rapids-0.17
  conda activate coiled-optimus-gpu
fi

if [ "$rapids" = true ]; then
  echo "Installing rapids support"
  conda install -c rapidsai -c nvidia -c conda-forge -c defaults rapids-blazing=0.17 python=3.7 cudatoolkit=10.2
fi

pip install git+https://github.com/hi-primus/dateinfer.git
pip install cytoolz

if [ "$spark" = true ]; then
  echo "Installing optimus with Spark support"
  pip install --upgrade git+https://github.com/hi-primus/optimus.git@develop-22.1#egg=pyoptimus[spark]
else
  echo "Installing optimus"
  pip install --upgrade git+https://github.com/hi-primus/optimus.git@develop-22.1
fi
