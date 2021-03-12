#!/bin/bash
if [[ ! -f ./packages/web/.env && ! -f ./packages/api/.env ]]; then
    echo 'Public address of current machine (leave blank to use localhost instead)'
    read address
    alreadyinitialized=false
else
    echo 'Use localhost? [y/N]'
    read answer
    if echo "$answer" | grep -iq "^y" ;then
      localhost=$true
    else
      localhost=$false
    fi
    alreadyinitialized=true
fi

source stop-bumblebee.sh
source install-optimus.sh
source start-bumblebee.sh
source start-jupyter.sh
