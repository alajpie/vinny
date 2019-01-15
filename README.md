This repository is available at [sr.ht](https://git.sr.ht/~k2l8m11n2/vinny) and [GitHub](https://github.com/k2l8m11n2/vinny). Please submit patches to `autoclave@firemail.cc` or as pull requests on GitHub.

# Installation

1. Do `yarn install` to install dependencies
2. Copy the example `secrets.yaml` and `config.yaml` files and edit to taste
3. Run with CONFIG, SECRETS and SQLITE environment variables, e.g.
   `CONFIG=/home/vinny-config.yaml SECRETS=/home/vinny-secrets.yaml SQLITE=/home/vinny.sqlite node src/index.js`
   (SQLITE is a path to where the database is stored)
