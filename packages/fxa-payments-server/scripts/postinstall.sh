#!/bin/bash

# note, no set -ex here, we do not want to fail if npm link fails.

# attempt to link fxa-content-server. This will fail on Circle.
# instead the package will be copied on Docker build
npm link ../fxa-content-server
if [ $? -eq 0 ]
then
  echo "using a locally linked fxa-content-server"
else
  echo "could not link the fxa-content-server"
fi
