#!/bin/bash

npm install --save-dev coveralls@2
nyc report --reporter=text-lcov | coveralls