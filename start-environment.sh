if [[ ! -f ./packages/web/.env && ! -f ./packages/api/.env ]]; then
    echo 'Public address of current machine (leave blank to use localhost instead)'
    read address
    alreadyinitialized=false
else
    alreadyinitialized=true
fi
source start-bumblebee.sh
source start-jupyter.sh
