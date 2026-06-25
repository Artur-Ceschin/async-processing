

function create_sharp_layer() {

  # this will create the folders correctly
  echo "Cleaning the workspace..."

  # we will add layers before because this will run in our package.json which is in our root
  rm -rf layers/sharp

  echo "Creating directories..."

  mkdir -p layers/sharp/nodejs

  # the problem is that this will generate the latest one not necessary the correct one
  # so we will take the version from the project
  SHARP_VERSION=$(node -e "console.log(require('./package.json').dependencies.sharp)")

  echo "Installing dependencies"
  cd layers/sharp/nodejs

  export NODE_ENV=production

  npm init -y
  npm i --cpu=arm64 --os=linux --libc=glibc sharp@$SHARP_VERSION

  rm -rf package-lock.json package.json
}


create_sharp_layer

echo "Layers successfully generated"
