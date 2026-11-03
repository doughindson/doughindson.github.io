#!/bin/bash
# Polite one-at-a-time fetch of every page URL; saves raw HTML and ?format=json
OUT=reference/raw-html
UA="Mozilla/5.0 (personal site export by owner)"
for path in "" about 404 selected-projects home selected-projects-1 design-motion \
 design-motion/transportation-alternatives design-motion/thorne-build-to-last design-motion/citi \
 design-motion/ibm-illustrations design-motion/thorne-healthy-aging design-motion/microsoft-365 \
 design-motion/ibm-watsonx design-motion/landscapes design-motion/chase-usopen design-motion/disconnect \
 design-motion/here-we-are design-motion/spotify-premium design-motion/ibm-partnerships; do
  slug=${path//\//__}; [ -z "$slug" ] && slug=_root
  code=$(curl -sL -A "$UA" -o "$OUT/$slug.html" -w "%{http_code}" "https://www.doughindson.com/$path")
  sleep 1.5
  curl -sL -A "$UA" -o "$OUT/$slug.json" "https://www.doughindson.com/$path?format=json"
  echo "$code /$path $(wc -c < $OUT/$slug.html) json:$(wc -c < $OUT/$slug.json)"
  sleep 1.5
done
