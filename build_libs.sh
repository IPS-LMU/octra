#!/usr/bin/env bash

echo "Build libs..."
nx build components --with-deps
echo "move to extern..."
rm -rf extern
mv dist extern
echo "finish"
