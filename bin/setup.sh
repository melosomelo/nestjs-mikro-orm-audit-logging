set -e

cp .example.env .env

docker compose up -d 

sleep 8

docker exec -t api_db createdb -U user unittest

yarn run migration:up

DB_NAME=unittest yarn migration:up
