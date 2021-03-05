#!/bin/bash

cd scripts

if [[ "$1" == "start" ]]; then

    if [[ "$2" == "jupyter" ]]; then
      source start-jupyter.sh
    elif [[ "$2" == "bumblebee" ]]; then
      source start-bumblebee.sh
    else
      source start-environment.sh
    fi

elif [[ "$1" == "restart" ]]; then

    if [[ "$2" == "jupyter" ]]; then
      source restart-jupyter.sh
    elif [[ "$2" == "bumblebee" ]]; then
      source restart-bumblebee.sh
    else
      source restart-environment.sh
    fi

elif [[ "$1" == "install" ]]; then

    if [[ "$2" == "optimus" ]]; then
      source install-optimus.sh
    elif [[ "$2" == "bumblebee" ]]; then
      source install-bumblebee.sh
    else
      source install-environment.sh
    fi

elif [[ "$1" == "update" ]]; then

    if [[ "$2" == "optimus" ]]; then
      source update-optimus.sh
    elif [[ "$2" == "bumblebee" ]]; then
      source update-bumblebee.sh
    else
      source update-environment.sh
    fi

elif [[ "$1" == "stop" ]]; then

    if [[ "$2" == "bumblebee" ]]; then
      source stop-bumblebee.sh
    else
      echo "Unknown parameter, did you mean \"bbi stop bumblebee\"?"
    fi

else
    echo "Unknown parameter, try \"bbi install environment\""
fi
