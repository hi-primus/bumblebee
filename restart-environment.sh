echo 'Use localhost? [y/N]'
read answer
cd
if echo "$answer" | grep -iq "^y" ;then
  localhost=$true
else
  localhost=$false
fi
source restart-bumblebee.sh
source restart-jupyter.sh
