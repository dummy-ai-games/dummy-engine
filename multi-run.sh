#!/bin/sh
echo "starting up primary server"
tmux -c "NODE_ENV=userdebug node dummy.js &"

index=0
basePort=9000

while [ $index -lt 10 ]
do
   echo "starting up server #" $index
   port=`expr $index + $basePort`
   tmux -c "NODE_ENV=userdebug node dummy.js $port &"

   if [ $index -eq 20 ]
   then
      break
   fi
   index=`expr $index + 1`
done

