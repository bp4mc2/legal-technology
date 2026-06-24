set -euo pipefail

python tools/generate_respec.py

mkdir -p ./dist ./dist/assets
find ./dist -maxdepth 1 -name '*.html' -delete
rm -rf ./dist/site

for src in ./build/docs/respec/*.html; do
	out="./dist/$(basename "$src")"
	npx respec \
		--src "$src" \
		--out "$out" \
		--localhost \
		--use-local \
		--timeout 60 \
		--verbose
done

cp -R ./build/docs/assets/. ./dist/assets/
