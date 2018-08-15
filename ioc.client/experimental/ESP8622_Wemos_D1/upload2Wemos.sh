#!/bin/bash

TARGET="/dev/ttyUSB0"

DELAY=0.15
CHUNKSIZE=48

TMPFILE="/tmp/uploadWemos.tmp"

# function to send TMP data to Wemos
STOREVAR="$2"
function toWemos {
  echo -n "require('Storage').write('$STOREVAR','" > $TARGET
  cat $TMPFILE | sed "s/'/\"/g" | sed "s.\\\.\\\\\\\.g" > $TARGET
  #cat $TMPFILE | sed "s/'/\"/g" > $TARGET
  #cat $TMPFILE > $TARGET
  echo "',$O,$WRITESIZE);" > $TARGET
  sleep $DELAY
}

# erase the memory space
echo "require('Storage').erase('$STOREVAR')" > $TARGET
sleep 3

# get file size in bytes
FILESIZE="`ls -l $1 | cut -d' ' -f5`"
WRITESIZE=$(( $FILESIZE ))

# use a for loop to write the storage
O=0
j=0
for (( i=$CHUNKSIZE; i<$FILESIZE; i=$(( i+$CHUNKSIZE )) ))
do
     O=$(( $i-$CHUNKSIZE ))
     echo "uploading offset $O to $i bytes..."
     j=$i
     dd status=none if=$1 bs=1 skip=$O count=$CHUNKSIZE > $TMPFILE
     toWemos
done
k=$(( $FILESIZE-$j ))
if [ -z "$(tail -c -1 <$1)" ]; then
 k=$(( $k-1 ))
fi
O=$j
echo "uploading offset $O to $FILESIZE, final $k bytes..."
dd status=none if=$1 bs=1 skip=$j count=$k  > $TMPFILE
toWemos

echo "// uploaded $FILESIZE bytes." > $TARGET
echo "done."
