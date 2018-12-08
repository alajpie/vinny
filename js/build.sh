sudo docker-compose build --build-arg "COMMIT=$(git rev-parse --short HEAD | tr -d n; test -n "$(git status --porcelain)" && echo ", modified")"
