#!/bin/bash

yum install -y mesa-libGL-devel libXi-devel libXtst-devel libXinerama-devel
yarn
yarn build
