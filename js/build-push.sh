commit=$(git rev-parse --short HEAD | tr -d "\n"; test -n "$(git status --porcelain)" && echo -n ", modified")
branch=$(git branch | sed -n -e 's/^\* \(.*\)/\1/p')
str="${commit} (${branch})"
sudo docker build --build-arg "COMMIT=$str" . -t vinny -t gcr.io/priv-224919/vinny
sudo docker push gcr.io/priv-224919/vinny
