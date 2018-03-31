#!/usr/bin/env bash

echo Firing up hugo server from run.sh yo!
#hugo -D -w -v --debug --log server --theme=s2b_hugo_theme --disableFastRender
#hugo -D -w -v --debug --log server --theme=s2b_bulma --disableFastRender

echo run.sh: Using theme configured in config.toml
hugo -D -w -v --debug --log server --disableFastRender
